/**
 * @import {PAMSerialize, CommonResponseOld, PluginCtx, chatCache, contactCache, ContactCache, Plugin, CommonResponse,
 * PAMSerialize} from "../types/types"
 */

// import statement
import { pluginAccessManagerStmt } from "../database/table-plugin-access-manager.js"
import { db } from "../database/database.js"

// store import
import { contactStore } from "../store/contact-store.js"

// manager import
import { pluginManager } from "./plugin-manager.js"

// lain lain
import { config } from "../config.js"


class PluginAccessManager {

    /**@type {Map<string, Set<string>>} */
    pluginAccessManagerMap = new Map()

    /**@type {Set<string>} */
    ownerList = new Set()

    constructor() {
        for (const row of pluginAccessManagerStmt.selectAll.iterate()) {
            const { groupJid, lid, file_name } = row

            if (!this.pluginAccessManagerMap.has(groupJid)) this.pluginAccessManagerMap.set(groupJid, {})
            const currentPermissionMap = this.pluginAccessManagerMap.get(groupJid)

            if (!currentPermissionMap[lid]) currentPermissionMap[lid] = new Set()
            currentPermissionMap[lid].add(file_name)
        }

        config.OWNER.filter(Boolean)
            .map(v => `${v}@s.whatsapp.net`)
            .forEach(v => this.ownerList.add(v))
    }

    /**
     * 
     * @param {ContactCache|undefined} chat 
     * @param {ContactCache|undefined} contact 
     * @param {Plugin|undefined} plugin 
     * @returns {boolean} true atau false
     */
    hasAccess(chat, contact, plugin) {
        const isContactAllowed = this.pluginAccessManagerMap.get(chat?.primaryId)?.[contact?.primaryId]?.has(plugin?.meta?.fileName)
        const isOwner = this.ownerList.has(contact?.secondaryId)
        const isChatAllowed = this.pluginAccessManagerMap.get(chat?.primaryId)?.[chat?.primaryId]?.has(plugin?.meta?.fileName)
        return isContactAllowed || isOwner || isChatAllowed || false
    }

    /**
     * default grant, buat ngasih akses plugin
     * @param {PAMSerialize} param
     * @returns {CommonResponse<string>}
     */
    grant(param) {
        const { groupJid, authorLid, participantLid, pluginCommands, timestamp } = param
        if (!pluginCommands || pluginCommands?.length === 0) return { error: `command kosong. tolong isikan command yang mau di grant` }

        const invalidCommands = pluginCommands
            .map(cmd => !pluginManager.pluginMap.get(cmd) ? cmd : undefined)
            .filter(Boolean)

        if (invalidCommands && invalidCommands.length > 0) return {
            error: `fail!\ninvalid plugin command:
${invalidCommands.map(v => "- " + v).join("\n")}`
        }

        const chat = contactStore.getContactByPrimariId(groupJid)
        if (!chat) return { error: `gagal menemukan chat id` }

        const authorContact = contactStore.getContactByPrimariId(authorLid)
        if (!authorContact) return { error: `gagal menemukan author id` }

        const participantContact = contactStore.getContactByPrimariId(participantLid)

        if (!participantContact) return { error: `gagal menemukan participant id` }

        /**
         * @typedef SQLPayload
         * @property {number} chatId
         * @property {number} contactId
         * @property {number} authorId
         * @property {string} fileName
         * @property {number} timestamp
         */

        /**@type {SQLPayload[]} */
        const payloads = pluginCommands.map(cmd => {
            const plugin = pluginManager.getPlugin(cmd)
            return {
                chatId: chat.id,
                contactId: participantContact.id,
                authorId: authorContact.id,
                fileName: plugin?.meta?.fileName,
                timestamp,
            }
        })

        // batch insert into db
        /**@type {(SQLPayload & {changes: string})[]} */
        const DBResults = payloads.map(p => {
            const DBr = pluginAccessManagerStmt.grant.run(p)
            p.changes = DBr.changes
            return p
        })

        // UPDATE CACHE
        if (!this.pluginAccessManagerMap.has(groupJid)) this.pluginAccessManagerMap.set(groupJid, {})
        const currentPermissionMap = this.pluginAccessManagerMap.get(groupJid)

        if (!currentPermissionMap[participantLid]) currentPermissionMap[participantLid] = new Set()

        // filtering
        /**@type {(SQLPayload & {changes: string})[]} */
        const changesPayload = []

        /**@type {(SQLPayload & {changes: string})[]} */
        const unchangesPayload = []

        DBResults.forEach(payload => {
            if (payload.changes === 1) {
                changesPayload.push(payload)
            } else {
                unchangesPayload.push(payload)
            }
        })

        changesPayload.forEach(payload => {
            currentPermissionMap[participantLid].add(payload.fileName)
        })

        const changesPayloadString = changesPayload.map(v => {
            const fileName = v.fileName
            const plugin = pluginManager.pluginArray.find(p => p?.meta?.fileName === fileName)
            // dekor disini
            return `- ${plugin.commands.join(", ")} (${plugin.name})`
        }).join('\n')

        const unchangesPluginString = unchangesPayload.map(v => {
            const fileName = v.fileName
            const plugin = pluginManager.pluginArray.find(p => p?.meta?.fileName === fileName)
            // dekor disini
            return `- ${plugin.commands.join(", ")} (${plugin.name})`
        }).join('\n')

        const participantName = participantContact?.name ?? 'beliau'

        const ownedText = unchangesPluginString
            ? `

dan ${participantName} udah punya akses ke plugin
${unchangesPluginString}`
            : ``


        const newPluginText = changesPayloadString
            ? `yay! ${participantName} punya akses ke plugin
${changesPayloadString}`
            : `gaada akses plugin baru`
        const print = `${newPluginText}${ownedText}`

        return {
            data: print
        }
    }

    /**
     * default revoke, buat revoke plugin akses
     * @param {PAMSerialize} param
     * @returns {CommonResponse<string>}
     */
    revoke(param) {
        const { groupJid, participantLid, pluginCommands, timestamp } = param
        if (!pluginCommands || pluginCommands?.length === 0) return { error: `command kosong. tolong isikan command yang mau di revoke` }

        const invalidCommands = pluginCommands
            .map(cmd => !pluginManager.pluginMap.get(cmd) ? cmd : undefined)
            .filter(Boolean)

        if (invalidCommands && invalidCommands.length > 0) return {
            error: `fail!\ninvalid plugin command:
${invalidCommands.map(v => "- " + v).join("\n")}`
        }

        const chat = contactStore.getContactByPrimariId(groupJid)
        if (!chat) return { error: `tidak bisa menemukan grup` }

        const participantContact = contactStore.getContactByPrimariId(participantLid)
        if (!participantContact) return { error: `tidak bisa menemukan participant` }

        /**
         * @typedef {object} SQLPayload
         * @property {string} chatId
         * @property {string} contactId
         * @property {string} fileName
         */

        /**@type {SQLPayload[]} */
        const sqlPayloads = pluginCommands.map(cmd => {
            const plugin = pluginManager.getPlugin(cmd)
            return {
                chatId: chat.id,
                contactId: participantContact.id,
                fileName: plugin.meta.fileName
            }
        })

        // batch insert into db
        /**@type {(SQLPayload & {changes: string})[]} */
        const sqlPayloadAndDBResults = sqlPayloads.map(payload => {
            const DBResult = pluginAccessManagerStmt.deleteSinglePlugin.run(payload)
            payload.changes = DBResult.changes
            return payload
        })

        // UPDATE CACHE
        if (!this.pluginAccessManagerMap.has(groupJid)) this.pluginAccessManagerMap.set(groupJid, {})
        const group = this.pluginAccessManagerMap.get(groupJid)

        if (!group[participantLid]) group[participantLid] = new Set()

        // FILTER
        // filtering
        /**@type {(SQLPayload & {changes: string})[]} */
        const changePayloads = []

        /**@type {(SQLPayload & {changes: string})[]} */
        const unchangePayloads = []

        sqlPayloadAndDBResults.forEach(payload => {
            if (payload.changes === 1) {
                changePayloads.push(payload)
            } else {
                unchangePayloads.push(payload)
            }
        })

        // delete cache
        changePayloads.forEach(r => {
            group[participantLid].delete(r.fileName)
        })

        // kita gak mau nyimpen entries dengan set kosong, jadi kita hapus saja entry nya biar bersih
        if (group[participantLid].size === 0) {
            delete group[participantLid]
        }

        // kita juga gak mau nyimpen map kosong, jadi map nya di hapus juga
        if (Object.keys(pluginAccessManager.pluginAccessManagerMap.get(groupJid) ?? {})?.length === 0) {
            this.pluginAccessManagerMap.delete(groupJid)
        }

        // susun kalimat
        const changesPayloadString = changePayloads.map(v => {
            const fileName = v.fileName
            const plugin = pluginManager.pluginArray.find(p => p?.meta?.fileName === fileName)
            // dekor disini
            return `- ${plugin.commands.join(", ")} (${plugin.name})`
        }).join('\n')

        const unchangesPluginString = unchangePayloads.map(v => {
            const fileName = v.fileName
            const plugin = pluginManager.pluginArray.find(p => p?.meta?.fileName === fileName)
            // dekor disini
            return `- ${plugin.commands.join(", ")} (${plugin.name})`
        }).join('\n')

        const participantName = participantContact?.name ?? 'beliau'

        const ownedText = unchangesPluginString
            ? `

dan ${participantName} emang udah gak punya akses ke plugin
${unchangesPluginString}`
            : ``


        const newPluginText = changesPayloadString
            ? `${participantName} di revoke dari plugin
${changesPayloadString}`
            : `ehmm... no new revoke`
        const print = `${newPluginText}${ownedText}`

        return {
            data: print
        }
    }

    /**
     * @returns {CommonResponse <string>}
     */
    nuke() {
        const totalAccessPlugin = db.prepare(`
            SELECT
            COUNT(*) as total
            FROM plugin_access_manager
            `).get()?.total ?? 0

        if (totalAccessPlugin === 0) return {
            data: "sudah bersih 🌈"
        }

        const SQL = `
        DELETE FROM plugin_access_manager
        `
        this.pluginAccessManagerMap.clear()
        db.exec(SQL)
        return {
            data: `💣💥duar.. semua akses plugin telah di cabut. total nya ada ${totalAccessPlugin}`
        }
    }

    /**
     * fungsi ini mengembalikan string, berupa data plugin access tapi group by user
     * @param {string} jid jid group
     * @returns {CommonResponse <string|undefined>}
     */
    getStringGroupByContact = (jid) => {
        try {
            const userParamType = typeof (jid)
            if (userParamType !== "string") return {
                error: `input harus string, bukan ${userParamType}`
            }

            if (!userParamType) return {
                error: 'input gak boleh kosong'
            }

            const chat = contactStore.getContactByPrimariId(jid)
            if (!chat) return {
                error: `tidak bisa menemukan chat id dengan input ${jid}`
            }

            const _contactMap = new Map()
            db.prepare(`
SELECT
	coalesce(contact.name, 'unknown') as pushName,
	pam.file_name as fileName,
	contact.id as contactId,
    contact.primary_server as primaryServer

FROM plugin_access_manager pam

LEFT JOIN contacts contact
ON pam.contact_id = contact.id

WHERE pam.chat_id = :chatId

ORDER BY
	lower (contact.name),
	lower (pam.file_name)
`).all({
                chatId: chat.id
            })
                .map(v => {
                    v.plugin = pluginManager.pluginArray.find(p => p.meta.fileName === v.fileName)
                    return v
                }).forEach(v => {
                    const { contactId, pushName, fileName, plugin, primaryServer } = v
                    const entry = _contactMap.get(v.contactId)
                    if (!entry) {
                        _contactMap.set(contactId, {})
                        const obj = _contactMap.get(contactId)
                        obj.pushName = pushName
                        obj.contactId = contactId
                        obj.primaryServer = primaryServer
                        obj.content = []
                    }
                    const current = _contactMap.get(contactId)
                    current.content.push({
                        plugin: plugin,
                        fileName: fileName,
                    })
                });

            const result = Array.from(_contactMap)
                .sort((a, b) => (a[1].primaryServer ?? "").localeCompare(b[1].primaryServer ?? ""))
                .map(v => {
                    // dekorasi disini
                    const displayName = v[1].primaryServer === "g.us" ? "current chat" : (v[1]?.pushName ?? '(unknown)')
                    const pushName =`${v[1].contactId === chat.id ? "" :""}` + displayName + ` [${v[0]}]`
                    const content = v[1]?.content

                    const row = content.map(v => {
                        if (!v?.plugin) return "- [gone] " + v.fileName
                        return "- " + v.plugin.commands.join(', ') + " (" + v.plugin.name + ")"
                    }).sort().join("\n")

                    return `${pushName}\n${row}`
                })
                .join('\n\n')
            return {
                data: result 
            }
        } catch (e) {
            console.error(e)
            return {
                error: '❌ manager fail\n' + e.message
            }
        }
    }

    /**
 * fungsi ini mengembalikan string, berupa data plugin access tapi group by plugin
 * @param {string} jid jid group
 * @returns {CommonResponse <string>}
 */
    getStringGroupByPlugin = (jid) => {
        try {
            const userParamType = typeof (jid)
            if (userParamType !== "string") return {
                error: `input harus string, bukan ${userParamType}`
            }

            if (!userParamType) return {
                error: 'input gak boleh kosong'
            }

            const chat = contactStore.getContactByPrimariId(jid)
            if (!chat) return {
                error: `tidak bisa menemukan chat id dengan input ${jid}`
            }
            let tempMap = new Map()
            const dbr = db.prepare(`
SELECT

pam.file_name as fileName,
contact.name as pushName


FROM plugin_access_manager as pam

LEFT JOIN contacts contact
ON pam.contact_id = contact.id

WHERE pam.chat_id = :chatId

ORDER BY 

lower (pam.file_name),
lower (contact.name)
`).all({
                chatId: chat.id
            })

            if (dbr.length === 0) return {
                data: '👻 no data'
            }
            dbr.map(v => {
                v.plugin = pluginManager.pluginArray.find(plugin => plugin.meta.fileName === v.fileName)
                return v
            }).forEach(v => {
                const exist = tempMap.get(v.fileName)
                if (!exist) tempMap.set(v.fileName, [])
                const current = tempMap.get(v.fileName)
                current.push(v)
            })

            let arr = Array.from(tempMap)

            let result = arr.map(v => {
                let pluginName = "[?] " + v[0]
                const plugin = v?.[1]?.[0]?.plugin
                if (plugin) {
                    pluginName = `${plugin.commands.join(', ')} (${plugin?.name})`
                }

                const row = v?.[1].map(v => '- ' + (v.pushName ?? '(unknown)')).join('\n')
                return pluginName + '\n' + row
            }).sort().join("\n\n")

            return {
                data: result
            }
        } catch (e) {
            console.error(e)
            return {
                error: '❌ catch error\n' + e.message
            }
        }
    }

    /**
     * fungsi untuk menghapus semua plugin access pada satu kontak menggunakan contact id dan di dalam satu grup chat
     * @param {PAMSerialize} param
     * @returns {CommonResponse<string>}
     */
    drop(param) {
        const { groupJid, restString } = param
        let _c = restString ?? ''
        _c = _c.trim()
        const contactId = _c

        // validate input
        if (!/^\d+$/.test(contactId.trim())) return { error: `input harus id contact yang valid` }

        // validate chat id
        const chat = contactStore.getContactByPrimariId(groupJid)
        if (!chat) return { error: `chat id tidak valid hm..` }

        // kita harus validate contactId yang di berikan user itu punya minimal 1 plugin access di current chat
        const exist = db.prepare(`
        SELECT EXISTS (
            SELECT 1
            FROM plugin_access_manager
            WHERE chat_id = :chatId
            AND contact_id = :contactId
        ) AS exist
        `).get({
            chatId: chat.id,
            contactId
        })?.exist
        if (exist === 0) return { error: `contact dengan id ${contactId} tidak memiliki akses apapun` }

        // dapatkan contact buat pushnames
        const contact = contactStore.getContactById(contactId)

        // delete from db
        const changes = db.prepare(`
            DELETE FROM plugin_access_manager
            WHERE chat_id = :chatId
            AND contact_id = :contactId
        `).run({
            chatId: chat.id,
            contactId: contactId
        })?.changes
        if (changes === 0) return { error: `nothing changed in db. weird` }

        // update cache
        const currentChatEntries = this.pluginAccessManagerMap.get(chat.primaryId)
        delete currentChatEntries[contact?.primaryId]

        // kita juga gak mau nyimpen map kosong, jadi map nya di hapus juga
        if (Object.keys(pluginAccessManager.pluginAccessManagerMap.get(groupJid) ?? {})?.length === 0) {
            this.pluginAccessManagerMap.delete(groupJid)
        }

        // kalau benar lanjut logic
        return {
            data: `semua plugin akses ${contact?.name ?? `beliau`} sudah di revoke di chat ini`
        }
    }
}

const pluginAccessManager = new PluginAccessManager()
export { pluginAccessManager }