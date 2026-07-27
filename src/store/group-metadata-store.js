// type import
/**
 * @import {GroupMetadata, WASocket, GroupParticipant} from "baileys"
 * @import {partcipantUpdateBase} from "../serializer/participant-update-serialize.js"
 */

import { db } from "../database/database.js"
import { groupParticipantsStmt } from "../database/table-group-participants.js"
import { config } from "../config.js"
import { contactStore } from "./contact-store.js"
import { areJidsSameUser, jidNormalizedUser, unixTimestampSeconds } from "baileys"

import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import { allPaths } from "../all-paths.js"

const botPn = config.BOT_PHONE_NUMBER + '@s.whatsapp.net'

/**
 * 
 * @param {GroupMetadata} gm 
 * @param {Map} mapAdmin 
 */
const updateAdminCache = (gm, mapAdmin) => {
    let tempAdmin = {}
    const participantAdmins = gm.participants.filter(participant => participant.admin)
    for (const participant of participantAdmins) {
        tempAdmin[participant.id] = participant.admin
    }
    mapAdmin.set(gm.id, tempAdmin)
}

class GroupMetadataStore {
    /**@type {Map<GroupMetadata['id'], GroupMetadata>} */
    #cacheGroupMetadata = new Map()

    /**@type {Map <GroupMetadata['id'], undefined>} */
    #cacheAdmin = new Map()

    constructor() {
        // load all admin from db to cacheAdmin
        const rows = groupParticipantsStmt.getAllAdmin.iterate({ botPn })
        for (const row of rows) {
            const { jid, lid, admin } = row
            const ada = this.#cacheAdmin.has(jid)
            if (!ada) this.#cacheAdmin.set(jid, {})
            const obj = this.#cacheAdmin.get(jid)
            obj[lid] = admin
        }
    }

    async pickSavedGM() {
        const gmFileNames = []
        try {
            const dirents = await readdir(allPaths.temp, {
                withFileTypes: true
            })
            for (const dirent of dirents) {
                if (dirent.isFile() && dirent.name.endsWith("@g.us.json")) {
                    gmFileNames.push(dirent.name)
                }
            }

            if (gmFileNames.length === 0) {
                return
            }

            for (const filename of gmFileNames) {
                const PATH = join(allPaths.temp, filename)
                const text = await readFile(PATH, {
                    encoding: "utf-8"
                })
                /**@type {GroupMetadata} */
                const gm = JSON.parse(text)
                console.log(`⚠️ loaded group metadata cache ${gm.subject}`)
                this.upsertGroupMetadata(gm)
            }

        } catch (e) {
            if (e.code === "ENOENT") {
            } else {
                console.error(e)
            }
        }

    }

    /**
     * fungsi ini juga di pasang di konfig socket key cachedGroupMetadata, tapi di buatin wrapepr lagi, cek aja di file socket.js
     * @param {GroupMetadata['id']} jid group jid
     * @param {WASocket} sock
     */
    async getGroupMetadata(jid, sock) {
        const cacheGroupMetadata = this.#cacheGroupMetadata.get(jid)
        if (cacheGroupMetadata) {
            return cacheGroupMetadata
        } else {
            try {
                const newGroupMetadata = await sock.groupMetadata(jid)
                this.upsertGroupMetadata(newGroupMetadata)
                return newGroupMetadata
            } catch (e) {
                console.error(e)
                return undefined
            }
        }
    }

    /**
     * 
     * @param {GroupMetadata} groupMetadata 
     * @param {WASocket} sock
     * @param {boolean} [isGroupUpsert] flag true kalau kamu panggil ini dari group.upsert event.
     */
    upsertGroupMetadata(groupMetadata, sock, isGroupUpsert) {
        const now = unixTimestampSeconds()
        const chat = contactStore.upsertAndGetContact({
            primaryId: groupMetadata.id,
            name: groupMetadata?.subject
        })

        if (groupMetadata?.author && isGroupUpsert) {
            const contactAuthor = contactStore.upsertAndGetContact({
                primaryId: groupMetadata.author,
                secondaryId: groupMetadata.authorPn
            })

            const contactBot = contactStore.upsertAndGetContact({
                primaryId: jidNormalizedUser(sock.user.lid),
                secondaryId: jidNormalizedUser(sock.user.id)
            })

            // INSERT BOT AS PARTICIPANT WITH INVITED BY AUTHOR
            groupParticipantsStmt.upsertParticipant.run({
                chatId: chat.id,
                contactId: contactBot.id,// bot id contact.id,
                invitedBy: contactAuthor.id,//--invited_by[chat.id / null]
                invitedAt: now, //--invited_at[second timestamp]
                admin: null, //--admin[admin / null]
                adminUpdatedAt: null, //--admin_updated_at[second timestamp]
                adminUpdatedBy: null, //--admin_updated_by[chat.id / null] 
            })

            console.warn(`NEW GM FROM UPSERT`, groupMetadata)
        }

        if (groupMetadata?.participants?.length) {
            const groupMetadataLids = groupMetadata.participants.map(p => p.id)

            // discover new lid
            const allLidFromDatabaseCurrentGroupChat = groupParticipantsStmt.getAllLid.all(chat.id).map(c => c.lid)
            const newLid = groupMetadataLids.filter(cacheLid => {
                return !allLidFromDatabaseCurrentGroupChat.some(dbLid => dbLid === cacheLid)
            })


            const participants = groupMetadata.participants

            for (const participant of participants) {
                const contact = contactStore.upsertAndGetContact({
                    primaryId: participant.id,
                    secondaryId: participant?.phoneNumber || null
                }, { skipAddCache: true })
                groupParticipantsStmt.upsertParticipant.run({
                    chatId: chat.id,
                    contactId: contact.id,
                    invitedBy: null,//--invited_by[chat.id / null]
                    invitedAt: now, //--invited_at[second timestamp]
                    admin: participant?.admin || null, //--admin[admin / null]
                    adminUpdatedAt: null,//now, //--admin_updated_at[second timestamp]
                    adminUpdatedBy: null, //--admin_updated_by[chat.id / null] 
                })
            }

            // filtering lid yang masih ada di db tapi di groupMetada baru gak ada, kita jadikan member kicked
            const lidDatabase = groupParticipantsStmt.getAllLid.all(chat.id).map(c => c.lid)
            const outdatedLid = lidDatabase.filter(dbLid => {
                return !groupMetadataLids.some(lid => lid === dbLid)
            })

            for (const lid of outdatedLid) {
                const contact = contactStore.upsertAndGetContact({
                    primaryId: lid
                })

                // flag member menjadi keluar
                groupParticipantsStmt.leaveParticipant.run({
                    chatId: chat.id,
                    contactId: contact.id,
                    invitedAt: now,
                    kickedBy: null,
                    kickedAt: now
                })
            }

            // update cache groupMetadata
            this.#cacheGroupMetadata.set(groupMetadata.id, groupMetadata)

            // update cache admin
            updateAdminCache(groupMetadata, this.#cacheAdmin)
        }


        // cache group metadata update [yang di ram]
        const ada = this.#cacheGroupMetadata.has(groupMetadata.id)
        if (!ada) {
        }

        else {
            const gm = this.#cacheGroupMetadata.get(groupMetadata.id)
            Object.assign(gm, groupMetadata)
        }
    }

    /**
     * @param {partcipantUpdateBase} update
     * @param {WASocket} sock
     */
    upsertParticipant(update, sock) {
        const {
            groupJid,
            authorLid,
            targetLid,
            targetPn,
            authorAction,
            timestamp = unixTimestampSeconds(), // paranoid lol :v
            admin } = update

        const chat = contactStore.upsertAndGetContact({
            primaryId: groupJid
        })

        // authorLid undefined jika participant join menggunakan url pulic gc,
        // jadi jika author lid undefined, maka authorContact juga undefined
        const authorContact = contactStore.upsertAndGetContact({
            primaryId: authorLid
        })

        const targetContact = contactStore.upsertAndGetContact({
            primaryId: targetLid,
            secondaryId: targetPn
        })

        if (authorAction === "add") {
            // database update
            groupParticipantsStmt.upsertParticipant.run({
                chatId: chat.id,
                contactId: targetContact.id,
                invitedBy: authorContact?.id || null,//--invited_by[chat.id / null]
                invitedAt: timestamp, //--invited_at[second timestamp]
                admin: null, //--admin[admin / null]
                adminUpdatedAt: null,//timestamp, //--admin_updated_at[second timestamp]
                adminUpdatedBy: null, //--admin_updated_by [ccontact.id / null] 
            })

            // groupMetadataCache update
            const groupMetadataCache = this.#cacheGroupMetadata.get(groupJid)
            if (!groupMetadataCache) {
                // DO NOTHING BECAUSE IAM LAZYYYYYY
            } else {
                /**@type {GroupParticipant} */
                const newParticipant = {
                    admin: undefined,
                    id: targetLid,
                    phoneNumber: targetPn,
                    lid: undefined,
                    username: undefined
                }
                const isParticipantExist = groupMetadataCache.participants.find(p => p.id === targetLid)
                if (!isParticipantExist) {
                    groupMetadataCache.participants.push(newParticipant)
                    groupMetadataCache.size = groupMetadataCache.participants.length
                }
            }

        }
        else if (authorAction === "remove") {
            // update database
            groupParticipantsStmt.leaveParticipant.run({
                chatId: chat.id, //--chat_id,
                contactId: targetContact.id, //--contact_id,
                invitedAt: timestamp, //--invited_at,
                kickedBy: authorContact.id, //--kicked_by,
                kickedAt: timestamp //--kicked_at
            })

            // update cacheAdmin
            delete this.#cacheAdmin.get(groupJid)?.[targetLid]

            // if bot kicked
            if (areJidsSameUser(update.targetLid, sock.user.lid)) {
                console.log("BOT KICKED", update)
                this.#cacheAdmin.delete(update.groupJid)
                groupParticipantsStmt.deleteGroupChat.run({ chatId: chat.id })
            }

            // update cacheGroupMetadata
            const groupMetadataCache = this.#cacheGroupMetadata.get(groupJid)
            if (!groupMetadataCache) {
                // DO NOTHING BECAUSE IAM LAZYYYYYY
            } else {
                const indexKickedParticipant = groupMetadataCache.participants.findIndex(p => p.id === targetLid)
                if (indexKickedParticipant > -1) {
                    groupMetadataCache.participants.splice(indexKickedParticipant, 1)
                    groupMetadataCache.size = groupMetadataCache.participants.length
                }
            }


        }
        else if (authorAction === "promote") {
            // update database
            groupParticipantsStmt.updateAdmin.run({
                chatId: chat.id, //-- chat.id < chat.id >
                contactId: targetContact.id, //--contact_id < contacts.id >
                admin: "admin", //--admin < biasanya admin / null >
                adminUpdatedBy: authorContact.id, //--admin_updated_by < contacts.id >
                adminUpdatedAt: timestamp, //--admin_updated_at < second timestamp >
                invitedAt: timestamp, //--invited_at < second timestamp >
            })

            // update cacheAdmin
            const obj = this.#cacheAdmin.get(groupJid)
            if (!obj) this.#cacheAdmin.set(groupJid, {})
            const temp = this.#cacheAdmin.get(groupJid)
            temp[targetLid] = 'admin'

            // update groupMetadataCache di participant
            const groupMetadataCache = this.#cacheGroupMetadata.get(groupJid)
            if (!groupMetadataCache) {
                // DO NOTHING BECAUSE IAM LAZYYYYYY
            } else {
                /**@type {GroupParticipant} */
                const newParticipant = {
                    admin: "admin",
                    id: targetLid,
                    phoneNumber: targetPn
                }
                const targetParticipant = groupMetadataCache.participants.find(p => p.id === targetLid)
                if (!targetParticipant) {
                    groupMetadataCache.participants.push(newParticipant)
                } else {
                    targetParticipant.admin = 'admin'
                }
            }

        }
        else if (authorAction === "demote") {
            groupParticipantsStmt.updateAdmin.run({
                chatId: chat.id, //-- chat.id < chat.id >
                contactId: targetContact.id, //--contact_id < contacts.id >
                admin: null, //--admin < biasanya admin / null >
                adminUpdatedBy: authorContact.id, //--admin_updated_by < contacts.id >
                adminUpdatedAt: timestamp, //--admin_updated_at < second timestamp >
                invitedAt: timestamp, //--invited_at < second timestamp >
            })

            // cache admin update
            delete this.#cacheAdmin.get(groupJid)?.[targetLid]

            // update groupMetadataCache di participant
            const groupMetadataCache = this.#cacheGroupMetadata.get(groupJid)
            if (!groupMetadataCache) {
                // DO NOTHING BECAUSE IAM LAZYYYYYY
            } else {
                /**@type {GroupParticipant} */
                const newParticipant = {
                    admin: undefined,
                    id: targetLid,
                    phoneNumber: targetPn
                }
                const targetParticipant = groupMetadataCache.participants.find(p => p.id === targetLid)
                if (!targetParticipant) {
                    groupMetadataCache.participants.push(newParticipant)
                } else {
                    targetParticipant.admin = null
                }
            }
        }
    }

    getAllAdminByGroupJid(jid) {
        return this.#cacheAdmin.get(jid)
    }
}

const groupMetadataStore = new GroupMetadataStore()
await groupMetadataStore.pickSavedGM()
export { groupMetadataStore }