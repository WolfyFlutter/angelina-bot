import { encodeBinaryNode, proto } from "baileys"
import { messagesStmt } from "../database/table-messages.js"
import { formatBytes, longNormalizer, sexyTrim } from "../helper/common.js"
import { contactStore } from "./contact-store.js"
import { db } from "../database/database.js"



/**
* @typedef {object} MessageRow
* @property {number} id
* @property {string} message_id
* @property {number} chat_id
* @property {number} contact_id
* @property {number} content_id
* @property {text|null} text
* @property {number} timestamp
* @property {Buffer} buffer
* @property {Buffer} node
*/

/**
 * @import {messageSerialize, CommonResponse} from "../types/types.js"
 * @import {WAMessageKey, JidServer} from "baileys"
 * @import {StatementResultingChanges} from "node:sqlite"
 */

/**
 * 
 * @param {JidServer} primaryServer 
 */
const serverMapping = (primaryServer) => {
    if (primaryServer === "g.us") return "👥 group chat"
    if (primaryServer === "lid") return "👤 private chat"
    if (primaryServer === "newsletter") return "📰 newsletter"
    if (primaryServer === "broadcast") return "📢 broadcast"
    return primaryServer
}

class MessageStore {

    /**
     * me return string statistik mini (jumlah pesan dan jenis pesan) dalam suatu chat
     * @param {number|string|undefined} id 
     * @returns {CommonResponse<string>}
     */
    getChatStats(id) {
        try {
            const chatId = id ?? null

            const chat = contactStore.getContactById(chatId)
            if (!chat) return { error: `tidak ditemukan chat dengan id ${id}` }

            const dbr = messagesStmt.getChatStats.all({ chatId })
            if (dbr?.length === 0) return { error: `tidak ada data` }

            const { name, primaryId } = chat
            let totalMessages = 0
            let totalBytes = 0
            const row = dbr.map(v => {
                totalMessages += v.total
                totalBytes += v.totalBytes ?? 0
                return `- ${v.total} ${v.content?.replace("Message", "")} (${formatBytes(v.totalBytes)}) | avg ${formatBytes(Math.floor(v.totalBytes / v.total))}`
            }).join('\n')
            const kata = `name ${name ?? `unknown`}
jid ${primaryId}

${totalMessages} total messages ${formatBytes(totalBytes)}

${row}`

            return { data: kata }
        } catch (e) {
            console.log(e)
            return { error: `catch error\n${e.message}` }
        }
    }

    /**
     * @returns {CommonResponse<string>}
     */
    getChatStatGlobal() {
        let totalMessages = 0
        let totalBytes = 0
        const dbr = messagesStmt.globalStat.all()
        if (!dbr) return { error: `no result from db` }
        let map = new Map()
        dbr.forEach(v => {
            if (!map.has(v.primaryServer)) map.set(v.primaryServer, [])
            const cm = map.get(v.primaryServer)
            cm.push(v)
        })
        let result = Array.from(map)
        let text = result.map(v => {
            const title = `*${serverMapping(v[0])}*`
            const rows = v[1].map(v => {
                totalMessages += v.totalMessages ?? 0
                totalBytes += v.totalBytes ?? 0
                return `- ${sexyTrim((v.name ?? `unknown`), 15)} [${v.contactId}]
> ${v.totalMessages} msg (${formatBytes(v.totalBytes)}) | avg ${formatBytes(Math.floor(v.totalBytes / v.totalMessages))}`
            }).join('\n\n')
            return title + '\n' + rows
        }).join('\n\n')

        const print = `*📦 total messages ${totalMessages} (${formatBytes(totalBytes)})*

${text}`
        return { data: print }
    }

    /**
     * 
     * @returns {CommonResponse<string>}
     */
    deleteAllMessages() {
        try {
            db.exec("DELETE FROM messages; PRAGMA wal_checkpoint(TRUNCATE); VACUUM");
            const pageCount = db.prepare("PRAGMA page_count").get();
            const freeList = db.prepare("PRAGMA freelist_count").get();
            console.log(pageCount, freeList);         
            return { data: `semua pesan sudah di hapus` }
        } catch (e) {
            console.error(e)
            return { error: `catch error\n${e.message} ` }
        }
    }

    /**
     * 
     * @param {messageSerialize} m 
     * @returns {Number|undefined} lastInsertRowId
     */
    saveMessage(m) {
        try {

            const message_id = m.key.id
            const chat_id = m.chat.id
            const contact_id = m.contact.id
            const content_id = m.contentType.id
            const text = m.text ?? null
            const timestamp = longNormalizer(m.messageTimestamp) ?? Math.floor(Date.now() / 1000)
            const buffer = proto.WebMessageInfo.encode(m).finish()
            let node = null
            try { node = encodeBinaryNode(m.node) } catch (_) { }

            const SqlPayload = { message_id, chat_id, contact_id, content_id, text, timestamp, buffer, node }
            const dbr = messagesStmt.insert.run(SqlPayload)
            return dbr.lastInsertRowid
        } catch (e) {
            console.error(`fail save message`, e, m)
        }
    }

    /**
     * 
     * @param {string|undefined} messageId
     * @returns {MessageRow | undefined} 
     */
    getDataByMessageId(messageId) {
        if (!messageId || typeof (messageId) !== "string") return undefined
        const dbr = messagesStmt.getRow.get({
            messageId
        })
        return dbr
    }
}

const messageStore = new MessageStore()
export { messageStore }

