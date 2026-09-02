/**
 * @import {Contact, LIDMapping, WAMessage, } from "baileys"
 * @import { ContactBase, ContactCache } from "../types/types.js"
 */
import { jidDecode, unixTimestampSeconds } from "baileys"
import { db } from "../database/database.js"
import { contactsStmt } from "../database/table-contacts.js"
import { toJsObject } from "../helper/common.js"
import { formatSecond } from "../helper/common.js"

const SATU_HARI = 24 * 60 * 60 * 1000
const ENAM_JAM = 12 * 60 * 60 * 1000
const SATU_MENIT = 1 * 60 * 1000

/**
 * @typedef {object} ContactSyncSerialize
 * @property {string} primaryId id primary
 * @property {string} primaryServer server
 * @property {string|null} name name
 * @property {string|null} secondaryId biasanya isi lid
 * @property {number} updatedAt timestamp detik
 */

/**
 * @typedef {object} UpsertAndGetContactOptions
 * @property {Boolean} skipAddCache
 */

class ContactStore {
    /**@type {Map<string, ContactCache>} */
    #contactCache = new Map()

    /**@type {NodeJS.Timeout} */
    #tempDebounceLidMapping

    /**@type {LIDMapping[]} */
    #tempLIDMappings = []

    /**
     * @type {{intervalValue: number, invervalObject: NodeJS.Timeout}}
     */
    #intervalCache = {
        intervalValue: undefined,
        invervalObject: undefined
    }

    /**
     * 
     * @param {number} ms 
     */
    setClearCacheEvery(ms) {
        if (!this.#intervalCache.intervalValue) {
            this.#intervalCache.invervalObject = setInterval(this.clearCache, ms)
            this.#intervalCache.invervalObject.unref()
            this.#intervalCache.intervalValue = ms
            console.log(`interval created! contact cache cleared every ${formatSecond(Math.floor(ms / 1000))}`)
        } else {
        }
    }

    clearCache = () => {
        const totalCache = this.#contactCache.size
        this.#contactCache.clear()
        console.log(`cache contact di bersihkan sebanyak ${totalCache}. akan di jalankan lagi dalam ${formatSecond(Math.floor(this.#intervalCache.intervalValue/1000))}`)
    }

    stopClearCache() {
        if (this.#intervalCache.intervalValue) {
            clearInterval(this.#intervalCache.invervalObject)
            this.#intervalCache.intervalValue = undefined
            this.#intervalCache.invervalObject = undefined
        } else {
        }
    }

    /**
     * this code is unuse
     * fungsi ini di panggil di event sync message biasanya di history sync type 4
     * @param {Contact[]} contacts - kontak array dari sync
     * @returns {void}
    */
    upsertContactsFromSync(contacts) {
        return

        let transactionOpen = false
        try {
            if (!Array.isArray(contacts) || contacts?.length === 0) return undefined

            const now = unixTimestampSeconds()

            /** @type Contact[] */
            const skippedContact = []

            /**@type {ContactSyncSerialize[]} */
            const contactSyncSerialize = []


            for (const contact of contacts) {

                const decode = jidDecode(contact?.id)
                if (!decode) continue

                let primaryId = null
                let secondaryId = null
                let primaryServer = null
                const name = contact?.name ?? contact?.notify ?? contact?.verifiedName ?? null

                if (decode.server === "lid") {
                    primaryId = contact.id
                    primaryServer = "lid"
                    if (contact?.phoneNumber) {
                        secondaryId = contact.phoneNumber
                    }
                }

                else if (decode.server === "s.whatsapp.net") {

                    if (contact.id === "0@s.whatsapp.net") {
                        primaryServer = "s.whatsapp.net"
                        primaryId = contact.id
                    } else {
                        primaryServer = null
                        secondaryId = contact.id
                    }

                } else {
                    primaryId = contact.id
                    primaryServer = decode.server
                }

                contactSyncSerialize.push({
                    primaryId,
                    name,
                    secondaryId,
                    primaryServer,
                    updatedAt: now
                })
            }

            db.exec(`BEGIN TRANSACTION`)
            transactionOpen = true
            for (let i = 0; i < contactSyncSerialize.length; i++) {
                contactsStmt.upsertContactFromHistorySync.run(contactSyncSerialize[i])
            }
            db.exec(`COMMIT`)
            transactionOpen = false
            // console.debug(`CONTACT UPSERT\n`, skippedContact, contactSyncSerialize)

        } catch (e) {
            if (transactionOpen) db.exec(`ROLLBACK`)
            console.error(`gagal upsertContactsFromSync`, e)
        }
    }

    /**
     * 
     * @param {LIDMapping[]} lidMappings 
     */
    upsertLidPnMappingsFromSync(lidMappings) {
        let transactionOpen = false
        try {
            if (!Array.isArray(lidMappings) || lidMappings?.length === 0) return undefined
            const now = unixTimestampSeconds()

            const dbPayloads = lidMappings.map(v => {
                const primaryId = v.lid
                const primaryServer = "lid"
                const secondaryId = v.pn
                const updatedAt = now
                return { primaryId, primaryServer, secondaryId, updatedAt }
            })

            db.exec(`BEGIN TRANSACTION`)
            transactionOpen = true
            for (const payload of dbPayloads) {
                contactsStmt.upsertContactFromHistorySync.run(payload)
            }
            db.exec(`COMMIT`)
            transactionOpen = false

            // console.debug(`UPSERT LIDPNMAPPINGS\n`, dbPayloads)
        } catch (e) {
            if (transactionOpen) db.exec(`ROLLBACK`)
            console.error('gagal upsertLidPnMappings', e)
        }
    }

    /**
     * 
     * @param {LIDMapping} lidMapping 
     * @returns {void}
     */
    upsertSingleLidMapping(lidMapping) {
        if (this.#tempDebounceLidMapping) clearTimeout(this.#tempDebounceLidMapping)
        this.#tempLIDMappings.push(lidMapping)
        this.#tempDebounceLidMapping = setTimeout(() => {
            this.upsertLidPnMappingsFromSync(this.#tempLIDMappings)
            this.#tempLIDMappings.length = 0
            this.#tempDebounceLidMapping = undefined
        }, 1000)
    }

    /**
     * @param {string} primaryId 
     * @returns {ContactCache|undefined}
     */
    getContactByPrimariId(primaryId) {
        const cache = this.#contactCache.get(primaryId)
        if (cache) return cache
        const DBresult = contactsStmt.selectContactByPrimaryId.get({
            primaryId: primaryId ?? null
        })
        if (DBresult) {
            const newCache = toJsObject(DBresult)
            this.#contactCache.set(primaryId, newCache)
            return newCache
        } else {
            return undefined
        }
    }

    /**
     * 
     * @param {ContactBase} base 
     * @param {UpsertAndGetContactOptions} options
     * @returns {ContactCache | undefined}
     */
    upsertAndGetContact(base, options) {
        const {
            primaryId = null,
            secondaryId = null,
            name = null,
            updatedAt = unixTimestampSeconds()
        } = base ?? {}

        const { skipAddCache } = options ?? {}

        if (!primaryId) return undefined

        const cache = this.#contactCache.get(primaryId)

        if (cache) {

            const needUpdateName = cache?.name !== name && name
            const needUpdatePn = cache?.secondaryId !== secondaryId && secondaryId

            if (needUpdateName || needUpdatePn) {
                const id = cache.id
                const DBResult = contactsStmt.updateContactNameAndSecondaryId.get({
                    id,
                    name,
                    secondaryId,
                    updatedAt
                })
                const veryNewCache = toJsObject(DBResult)
                this.#contactCache.set(primaryId, veryNewCache)
                // console.log(`[contact store] update contact ✨`, veryNewCache)
                return veryNewCache
            }

            else {
                return cache
            }
        }

        else {
            const decode = jidDecode(primaryId)
            const primaryServer = decode.server
            const DBResult = contactsStmt.contactUpsert.get({
                primaryId,
                primaryServer,
                secondaryId,
                name,
                updatedAt
            })

            /**@type {ContactCache} */
            const newCache = toJsObject(DBResult)

            const needUpdateName = newCache?.name !== name && name
            const needUpdatePn = newCache?.secondaryId !== secondaryId && secondaryId

            if (needUpdateName || needUpdatePn) {
                const id = newCache.id
                const DBResult = contactsStmt.updateContactNameAndSecondaryId.get({
                    id,
                    name,
                    secondaryId,
                    updatedAt
                })
                const veryNewCache = toJsObject(DBResult)
                this.#contactCache.set(primaryId, veryNewCache)
                // console.log(`[contact store] update contact ✨ & insert cache`, veryNewCache)
                return veryNewCache
            }

            else {
                if (!skipAddCache) {
                    this.#contactCache.set(primaryId, newCache)
                    // console.info(`[contact store] insert cache`, newCache)
                }
                return newCache
            }
        }
    }

    /**
     * 
     * @param {string} pn 
     * @returns {ContactCache}
     */
    getContactByPn(pn) {
        if (typeof (pn) !== "string" || !pn) return undefined
        return contactsStmt.selectContactByPn.get({
            pn
        })
    }

    /**
     * 
     * @param {string|number|undefined} id 
     * @returns {ContactCache}
     */
    getContactById(id) {
        if (!id) return undefined
        if (typeof (id) !== "string" && typeof (id) !== "number") return undefined
        return contactsStmt.selectContactById.get({
            id
        })
    }
}

const contactStore = new ContactStore()
contactStore.setClearCacheEvery(ENAM_JAM)


export { contactStore }
