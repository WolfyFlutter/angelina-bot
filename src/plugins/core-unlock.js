/** 
 * @import {PluginCtx, Plugin} from "../types/types.js"
 */

import { jidNormalizedUser, isLidUser,isJidGroup } from "baileys"

// ini nama nama untuk command unlock <alias>
const ALIAS = new Set([
    "laptop",
])

/**
 * @param {PluginCtx} ctx 
 * @returns {Promise<any>}
 */
async function run(ctx) {
    const { sock, jid, m, q, text } = ctx

    if (text === "--show-alias"){
        const aliasList = Array.from(ALIAS)
        .sort()
        .map((alias,i) => `${i+1}. ${alias}`)
        .join('\n')

        const print = `alias list\n${aliasList}`
        return await m.reply(print)
    }

    const isGroup = isJidGroup(jid)
    const isPrivateChat = isLidUser(jid)
    const botLid = jidNormalizedUser(sock.user.lid)
    const mentions = m?.message[m?.content]?.contextInfo?.mentionedJid ?? []

    // unlock from group, private chat, and self chat
    const selfUnlock = (isGroup || isPrivateChat) && m?.key?.fromMe && text === "me"
    const aliasUnlock = (isGroup || isPrivateChat) && ALIAS.has(text)

    // unlock from group
    const byGroupQuote = isGroup && !text && q?.sender === botLid
    const byGroupMention = isGroup && mentions.some(lid => lid === botLid)
    
    const byPrivate = isPrivateChat && !text && (!m?.key?.fromMe) 

    if (byGroupMention || byGroupQuote || byPrivate || selfUnlock || aliasUnlock) {
        if (!global?.isBotLocked) return await m.reply("gw udh unlock 😠")
        delete global.isBotLocked
        return await m.reply("✨ iam back, lets go!")
    }
}

const description = `fitur ini digunakan untuk unlock bot, kalau bot sebelumnya di lock.. ya pakai unlock buat buka :v.

cara penggunaan:

*unlock bot dari grup*
\`unlock <@mention_bot>\`
> unlock bot dengan mention bot, contoh command: unlock @angelina (mention ya)

\`unlock\`
> unlock bot dengan reply pesan bot

*unlock bot dari private chat*
\`unlock\`
> unlock bot dari private chat ke nomor bot. cukup ketik unlock aja

*unlock menggunakan self bot*
\`unlock me\`
> unlock bot dari nomor yang sama dengan bot, bisa di pakai di grup chat dan self chat. contoh command: unlock me

*unlock menggunakan alias*
\`unlock <alias>\`
> unlock bot menggunakan alias, unlock alias ini bisa di pakai dimana mana. contoh command: unlock angelina. lihat list alias menggunakan command: unlock --show-alias

\`unlock --show-alias\`
> buat liatin alias. kalian bisa ubah alias nya di file plugin ini, cari variabel ALIAS`

/**@type {Plugin} */
const plugin = {
    run,
    name: "unlock bot",
    commands: ["unlock"],
    categories: ["core"],
    description: description
}

plugin.meta = {
    fileName: "core-unlock.js",
    author: "wolep",
    note: "wakwau",
    version: "1"
}

plugin.config = {
    protected: true,
    bypassPrefix: true,
    bypassLock: true
}

export default plugin