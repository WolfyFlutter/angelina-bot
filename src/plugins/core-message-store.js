import { sexyTrim, formatBytes } from "../helper/common.js"

/**
 * @import {JidServer, BinaryNode} from "baileys"
 * @import {PluginCtx, Plugin} from "../types/types.js"
 */

import { binaryNodeToString, decodeBinaryNode, getDevice, jidDecode, proto, getBinaryNodeChild } from "baileys"
import { db } from "../database/database.js"
import { messageStore } from "../store/message-store.js"


/**@typedef {"stat"| "obj" | "node" | "delete-all" | "i" | undefined} SubCommand1 */
/**
 * @param {PluginCtx} ctx 
 * @returns {Promise <any>}
 */
async function run(ctx) {
    const { m, text, q, messageStore, contentTypeStore } = ctx
    const params = text?.match(/\S+/g) ?? []

    /**@type {SubCommand1} */
    const subCommand1 = params[0]
    const subCommand2 = params[1]


    if (subCommand1 === "stat") {
        if (!subCommand2) {
            const r = messageStore.getChatStatGlobal()
            if (r.error) return await m.reply(r.error)
            return await m.reply(r.data)
        } else {
            const r = messageStore.getChatStats(subCommand2?.trim())
            if (r.error) return await m.reply(r.error)
            return await m.reply(r.data)
        }
    }
    if (subCommand1 === "i") {
        if (!q) return await m.reply(`reply ke pesan`)
        const data = messageStore.getDataByMessageId(q.key.id)
        if (!data) return await m.reply(`no data from database`)
        const WAM = proto.WebMessageInfo.decode(data.buffer)
        /**@type {BinaryNode} */
        let node
        let _participant
        if (data.node) {
            node = await decodeBinaryNode(Buffer.from(data.node))
            _participant = node.attrs.participant
        }
        console.log(_participant)
        const participant = jidDecode(_participant)
        let device = participant?.device ? `linked device` : `phone`
        if (!data.node) device = `-`
        const deviceId = participant?.device ? participant.device : `-`
        const platrofm = getDevice(WAM.key.id)

        let biz = getBinaryNodeChild(node, `biz`)
        let meta = getBinaryNodeChild(node, `meta`)

        const kataKata = `*db*
msg index #${data.id}

*✉️ message*
id : ${WAM.key.id}
length : ${WAM.key.id.length}
type : ${contentTypeStore.getContentById(data.content_id)?.content}
binary size : ${formatBytes(data.buffer.length)}

*📱 device*
type : ${device}
id : ${deviceId}
platform : ${platrofm}

*🧩 additional nodes*
biz : ${biz ? 'yes' : 'no'}
meta : ${meta ? 'yes' : 'no'}`


        return await q.reply(kataKata)
    }
    else if (subCommand1 === "delete-all") {
        const result = messageStore.deleteAllMessages()
        if (result.error) return await m.reply(result.error)
        return await m.reply(result.data)
    }
    else if (subCommand1 === "obj") {
        return await messageHandler(ctx, params)
    }
    else if (subCommand1 === "node") {
        return await nodeHandler(ctx, params)
    }

    else if (!subCommand1) {
        return await m.reply(`opsi tersedia
- stat [id]
- delete-all`)
    }
    else {
        return await m.reply(`invalid subcommand 1`)
    }

}

/**
 * 
 * @param {PluginCtx} ctx 
 * @param {string[]|[]} params 
 */
const messageHandler = async (ctx, params) => {
    const { q, m, sock, jid } = ctx
    if (!q) return await m.reply(`reply ke pesan`)
    const dbr = messageStore.getDataByMessageId(q.key.id)
    if (!dbr) return m.reply(`data tidak di temukan di database`)
    const messageBinary = proto.WebMessageInfo.decode(dbr.buffer)
    const bufferText = Buffer.from(JSON.stringify(messageBinary, null, 2))
    return await sock.sendMessage(jid, {
        document: bufferText,
        mimetype: 'application/json',
        fileName: `message-${dbr.id}.json`
    }, { quoted: q })
}

const nodeHandler = async (ctx, params) => {
    const { q, m, sock, jid } = ctx
    if (!q) return await m.reply(`reply ke pesan`)
    const dbr = messageStore.getDataByMessageId(q.key.id)
    if (!dbr) return m.reply(`message tidak ditemukan`)
    if (!dbr?.node) return m.reply(`node nya null`)
    const buffer = Buffer.from(dbr.node)
    const json = await decodeBinaryNode(buffer)
    const text = binaryNodeToString(json)
    const textBuffer = Buffer.from(JSON.stringify(json, null, 2))
    return await sock.sendMessage(jid, {
        document: textBuffer,
        mimetype: 'application/json',
        fileName: `node-${dbr.id}.json`
    }, { quoted: q })
}

/**@type {Plugin} */
const plugin = {
    run,
    name: "messages store",
    commands: ["message", "m"],
    categories: ["core"],
    description: "messages store manager",
}

plugin.meta = {
    fileName: "core-message-store.js",
    author: "wolep",
    note: "auu..",
    version: "1"
}

plugin.config = {
    protected: true,
}

export default plugin