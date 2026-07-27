/**
 * @import {PluginCtx, Plugin} from "../types/types.js"
 */

import { jidNormalizedUser, isLidUser, isJidGroup } from "baileys"

// ini nama nama untuk command lock <alias>
const ALIAS = new Set([
    "laptop"
])

const aliasList = Array.from(ALIAS)
    .sort()
    .map((alias, i) => `${i + 1}. ${alias}`)
    .join('\n')

/**
 * @param {PluginCtx} ctx 
 * @returns {Promise<any>}
 */
async function run(ctx) {
    const { sock, jid, m, q, text, command } = ctx

    if (text === "--show-alias") {
        if (global?.isBotLocked) return
        const print = `alias list\n${aliasList}`
        return await m.reply(print)
    }

    const isGroup = isJidGroup(jid)
    const isPrivateChat = isLidUser(jid)
    const botLid = jidNormalizedUser(sock.user.lid)
    const mentions = m?.message[m?.content]?.contextInfo?.mentionedJid ?? []

    // lock from group, private chat, and self chat
    const selfLock = (isGroup || isPrivateChat) && m?.key?.fromMe && text === "me"
    const aliasLock = (isGroup || isPrivateChat) && ALIAS.has(text)

    // lock from group
    const gcQuotedLock = isGroup && !text && q?.sender === botLid
    const gcMentionLock = isGroup && mentions.some(lid => lid === botLid)

    // lock from private chat
    const pcLock = isPrivateChat && !text && (!m?.key?.fromMe)

    if (gcMentionLock || gcQuotedLock || pcLock || selfLock || aliasLock) {
        let kalimat = `🔒 bot locked, have a nice day ${m.contact.pushName ?? ''}`

        // sedikit sentuhan
        if (command === "lick") {
            if (aliasLock) {
                kalimat = `aw naughty ${m.contact.pushName ?? ''}... iya iya aku locked`
            } else {
                kalimat = `awh~ typo dikit gpp. bot locked`
            }
        }

        if (global?.isBotLocked) return await m.reply("udh lock kok")
        global.isBotLocked = true
        return await m.reply(kalimat)
    }
}

const description = `fitur ini digunakan untuk lock bot, mirip self tapi khusus owner dan berlaku juga untuk semua orang.

cara penggunaan:

*lock bot dari grup*
\`lock <@mention_bot>\`
> lock bot dengan mention bot, contoh command: lock @angelina (mention ya)

\`lock\`
> lock bot dengan reply pesan bot

*lock bot dari private chat*
\`lock\`
> lock bot dari private chat ke nomor bot. cukup ketik lock aja

*lock menggunakan self bot*
\`lock me\`
> lock bot dari nomor yang sama dengan bot, bisa di pakai di grup chat dan self chat. contoh command: lock me

*lock menggunakan alias*
\`lock <alias>\`
> lock bot menggunakan alias, lock alias ini bisa di pakai dimana mana. contoh command: lock angelina. lihat list alias menggunakan command: lock --show-alias

\`lock --show-alias\`
> buat liatin alias. kalian bisa ubah alias nya di file plugin ini, cari variabel ALIAS`


/**@type {Plugin} */
const plugin = { run }

plugin.name = "lock bot"
plugin.commands = ["lock", "lick", "diem"]
plugin.categories = ["core"]
plugin.description = description

plugin.meta = {
    fileName: "core-lock.js",
    author: "wolep",
    note: "self bot dan lock stay silent O.o",
    version: "1"
}

plugin.config = {
    protected: true,
    bypassPrefix: true,
    bypassLock: true
}

export default plugin