import { unixTimestampSeconds } from "baileys"
import { groupParticipantsStmt } from "../database/table-group-participants.js"
import { contactStore } from "./contact-store.js"
import { db } from "../database/database.js"

/**
* @typedef {object} SQLPayload
* @property {string} chatId
* @property {string} contactId
* @property {string|null} label
* @property {number} labelUpdatedAt
* @property {number} invitedAt
*/



/**@import {memberLabelBase} from "../serializer/member-label-serialize.js" */

class MemberLabelStore {
    /**@type {Map<string, memberLabelDb>} */
    #memberLabel = new Map()

    /**@type {NodeJS.Timeout} */
    #tempTimeout

    /**@type {memberLabelBase[]} */
    #tempMemberLabelBases = []

    /**@type {NodeJS.Timeout} */
    #cleanupInterval

    #MEMBER_LABEL_CACHE_TTL = 12 * 60 * 60 * 1000

    constructor() {
        // load all admin from db to cacheAdmin
        const rows = groupParticipantsStmt.getAllMemberLabel.iterate()
        for (const row of rows) {
            const { jid, lid, label } = row
            const ada = this.#memberLabel.has(jid)
            if (!ada) this.#memberLabel.set(jid, { _updatedAt: Date.now() })
            const obj = this.#memberLabel.get(jid)
            obj[lid] = label
        }

        this.#cleanupInterval = setInterval(() => this.#evictStale(), 30 * 60 * 1000)
        this.#cleanupInterval.unref()
    }

    #evictStale() {
        if (this.#memberLabel.size === 0) return
        const now = Date.now()
        for (const [jid, labelMap] of this.#memberLabel) {
            if ((labelMap?._updatedAt ?? 0) + this.#MEMBER_LABEL_CACHE_TTL < now) {
                this.#memberLabel.delete(jid)
            }
        }
        if (global?.gc) global.gc()
    }

    /**
     * @param {memberLabelBase} base 
     */
    update = (base) => {
        if (this.#tempTimeout) clearTimeout(this.#tempTimeout)
        this.#tempMemberLabelBases.push(base)
        this.#tempTimeout = setTimeout(this.#updateCacheAndDB, 2000)
    }

    #updateCacheAndDB = () => {
        const now = unixTimestampSeconds()

        /**@type {SQLPayload[]} */
        const sqlPayload = []

        for (const memberLabel of this.#tempMemberLabelBases) {
            const { groupJid, authorLid, authorPn, timestamp, label } = memberLabel
            const chat = contactStore.upsertAndGetContact({ primaryId: groupJid })
            const authorContact = contactStore.upsertAndGetContact({ primaryId: authorLid, secondaryId: authorPn })

            // for db looping
            sqlPayload.push({
                chatId: chat.id,// -- chats.id
                contactId: authorContact.id,// -- contacts.id
                label: label || null,// -- label <text/null>
                labelUpdatedAt: timestamp ?? now,//  -- label_updated_at <timestamp second>
                invitedAt: timestamp ?? now //  -- invited_at <timestamp second>
            })

            // update cache
            const _entryExist = this.#memberLabel.has(memberLabel.groupJid)
            if (!_entryExist) this.#memberLabel.set(memberLabel.groupJid, { _updatedAt: Date.now() })

            const gcLabel = this.#memberLabel.get(memberLabel.groupJid)
            gcLabel._updatedAt = Date.now()
            if (!memberLabel.label) {
                // user hapus label
                delete gcLabel[memberLabel.authorLid]
            } else {
                gcLabel[memberLabel.authorLid] = memberLabel.label
            }

            // hapus key kalau value kosong
            if (Object.keys(gcLabel).length === 0) {
                this.#memberLabel.delete(memberLabel.groupJid)
            }
        }

        db.exec(`BEGIN TRANSACTION`)
        for (const payload of sqlPayload) {
            groupParticipantsStmt.updateMemberLabel.run(payload)
        }
        db.exec(`COMMIT`)

        // clean temp
        sqlPayload.length = 0
        this.#tempMemberLabelBases.length = 0
        this.#tempTimeout = undefined

    }

    getAllMemberLabel(groupJid) {
        return this.#memberLabel.get(groupJid)
    }
}

const memberLabelStore = new MemberLabelStore()

export { memberLabelStore }