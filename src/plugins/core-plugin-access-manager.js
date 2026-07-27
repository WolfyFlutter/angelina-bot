import { getFirstStringAndRest } from "../helper/common.js"
import { jidDecode, unixTimestampSeconds } from "baileys"

/**
 * @import {PluginCtx, Plugin, PAMSubcommand, PAMSerialize} from "../types/types.js"
 */

/**
 * 
 * @param {PluginCtx} ctx 
 * @returns {PAMSerialize}
 */
const pamSerialize = (ctx) => {
    const { text, m, q, jid } = ctx
    const text1 = getFirstStringAndRest(text)

    const groupJid = jid
    const authorLid = m?.contact?.primaryId
    const timestamp = unixTimestampSeconds()

    const subCommand = text1.firstString

    const mMentionedJid = m?.message?.[m?.content]?.contextInfo?.mentionedJid

    let participantLid
    let pluginCommands

    if (q) {
        if (mMentionedJid && mMentionedJid?.length > 0) return {
            error: `gak boleh reply dan mention`
        }
        participantLid = q?.sender
        const cmds = text1.restString?.split(/\s/)?.filter(Boolean)
        pluginCommands = Array.from(new Set(cmds))

    } else {
        if (mMentionedJid && mMentionedJid?.length > 1) return { error: "tag harus satu" }
        participantLid = m.chat.primaryId
        let cleanText = text1.restString
        if (mMentionedJid && mMentionedJid?.length === 1) mMentionedJid.forEach(lid => {
            const tag = "@" + lid.split("@")[0]
            cleanText = cleanText.replaceAll(tag, "")
            participantLid = mMentionedJid[0]
        })
        const cmds = cleanText?.split(/\s/)?.filter(Boolean)
        pluginCommands = Array.from(new Set(cmds))
    }

    return {
        subCommand,
        authorLid,
        timestamp,
        groupJid,
        pluginCommands,
        participantLid,
        restString: text1.restString
    }
}

/**
 * 
 * @param {PluginCtx} ctx 
 * @returns {Promise <any>}
 */
async function run(ctx) {

    const { m, pluginAccessManager, jid, prefix, command, text } = ctx
    const serialize = pamSerialize(ctx)
    if (serialize.error) return await m.reply(serialize.error)
    const prefixCommand = `${(prefix ? prefix : '')}${command}`

    if (serialize.subCommand === "grant") {
        if (!serialize?.restString) {
            const kataKata = `*📖 penggunaan*

*kasih akses ke semua orang di chat saat ini*
- ${prefixCommand} grant <cmd...>

*kasih akses ke orang*
via tag
- ${prefixCommand} grant <mention> <cmd...>
- ${prefixCommand} grant <cmd...> <mention>

via reply
- ${prefixCommand} grant <cmd...>`
            return await m.reply(kataKata)
        }

        const r = await pluginAccessManager.grant(serialize)
        if (r?.error) return await m.reply(r.error)
        return await m.reply(r.data)
    }

    else if (serialize.subCommand === "revoke") {
        const r = await pluginAccessManager.revoke(serialize)
        if (r?.error) return await m.reply(r.error)
        return await m.reply(r.data)
    }

    else if (serialize.subCommand === "view") {
        const isGroupByPlugin = /-gbp\b/.test(serialize.restString)
        const func = isGroupByPlugin
            ? pluginAccessManager.getStringGroupByPlugin
            : pluginAccessManager.getStringGroupByContact

        const result = func(jid)
        if (result.error) return await m.reply(result.error)
        let kataKata = ''
        if (result?.data) {
            kataKata = `${result.data}
    
> pakai flag -gbp untuk group by plugin`
        }else{
            kataKata = `no data
tambah plugin permission dengan command
${prefixCommand} grant <cmd...> `
        }
        return await m.reply(kataKata)
    }

    else if (serialize.subCommand === "nuke") {
        const r = pluginAccessManager.nuke()
        if (r.error) return await m.reply(r.error)
        return await m.reply(r.data)
    }

    else if (serialize.subCommand === "drop") {
        if (!serialize?.restString) {
            const kataKata = `*📖 penggunaan*

*hapus semua akses plugin 1 kontak di current chat*
- ${prefixCommand} drop <contact_id>

> kontak id bisa di liat di ${prefixCommand} view`
            return await m.reply(kataKata)
        }
        const r = pluginAccessManager.drop(serialize)
        if (r?.error) return await m.reply(r.error)
        return await m.reply(r?.data)
    }
    else {
        return await m.reply(`command yang tersedia
- view
- grant
- revoke
- drop
- nuke`)
    }
}

const description = `plugin untuk manage akses plugin.

cara penggunaan:

*kasih akses plugin ke semua member di dalam chat*
\`pam grant <cmd...>\`
> contoh: pam grant ping. bisa di isi multiple cmd dan pisahkan dengan spasi.

*kasih akses plugin ke 1 orang*
via tag langsung
\`pam grant <@tag> <cmd...>\`
> contoh: pam grant @angelina menu. bisa di isi multiple cmd dan pisahkan dengan spasi, tag juga bisa di awal atau akhir.

via reply message
\`pam grant <cmd...>\`
> contoh: pam grant ping, bisa di isi multiple cmd, wajib reply ke message

*revoke akses plugin di chat*
\`pam revoke <cmd...>\`
> contoh: pam revoke ping. bisa di isi multiple cmd dan pisahkan dengan spasi.

*revoke akses ke 1 orang*
via tag langsung
\`pam revoke <@tag> <cmd...>\`
> contoh: pam revoke @angelina menu. bisa di isi multiple cmd dan pisahkan dengan spasi, tag juga bisa di awal atau akhir

via reply message
\`pam revoke <cmd...>\`
> contoh: pam revoke ping, bisa di isi multiple cmd, wajib reply ke message

*lihat semua akses plugin*
\`pam view [-gbp]\`
> view ini beda beda tiap chat. tambahkan param -gbp untuk view group by plugin

*hapus semua akses 1 kontak / 1 chat*
\`pam drop <contactId>\`
> contoh: pam drop 1. liat kontak id di pam view

*hapus semua akses*
\`pam nuke\`
> hapus semua plugin akses, semua kontak dan semua grup chat.`

/**@type {Plugin} */
const plugin = {
    run,
    name: "plugin access manager",
    commands: ["pam"],
    categories: ["core"],
    description
}

plugin.meta = {
    fileName: "core-plugin-access-manager.js",
    author: "wolep",
    note: "idk",
    version: "1",
}

plugin.config = {
    protected: true,
}

export default plugin