import { areJidsSameUser, getContentType, jidDecode, normalizeMessageContent } from "baileys"
import { getFirstStringAndRest } from "../helper/common.js"
import fs from "node:fs"

/**
 * @import {PluginCtx, Plugin} "../types/types.js"
 * @typedef {"get" | "g" | "install" | "i" | "install-url" | "iu" | "uninstall" | "u" | "view" | "v"} SubCommand1
 */

/**
 * buat nampilin quick help string kalau user cuma panggil command plugin tanpa param
 * @param {string} pc pluginCommand
 * @returns {string}
 */
const textEmptyParam = (pc) => `command :
- get <cmd> [-t]
- install [-r] (reply)
- install-url <url> [-r]
- uninstall <cmd>
- view <protected | bypass>

ketik ${pc} -help untuk bantuan.`

/**@param { PluginCtx } ctx */
async function run(ctx) {
    const { text, sock, jid, m, pluginManager, prefix, command, q, menuManager } = ctx
    const prefixCommand = `${prefix ?? ''}${command}`

    if (!text) return await m.reply(textEmptyParam(prefixCommand))
    const splitString1 = getFirstStringAndRest(text)

    /**@type {SubCommand1} */
    const subCommand1 = splitString1.firstString
    const restString1 = splitString1.restString

    if (subCommand1 === "get" || subCommand1 === "g") {
        const splitString2 = getFirstStringAndRest(restString1)
        const cmd = splitString2.firstString
        if (!cmd) return await m.reply(`masukkan command plugin yang ingin di get. contoh ${prefixCommand} get ping. untuk output teks bisa tambahkan param -t, jadi ${prefixCommand} get ping -t`)

        const additionalParam = splitString2.restString

        // options
        const sendAsText = /-t/.test(additionalParam)

        const plugin = pluginManager.getPlugin(cmd)
        if (!plugin) return await m.reply(`gak ada plugin dengan command ${cmd}`)

        const wam = q ?? m

        const caption = q ? `kamu di berikan plugin *${plugin.name}* oleh ${m?.contact?.name}` : `nih plugin *${plugin.name}* nya`

        if (sendAsText) {
            const pluginCode = await fs.promises.readFile(plugin.path, { encoding: 'utf-8' })
            return await sock.sendMessage(jid, {
                text: pluginCode
            }, { quoted: wam })
        } else {
            return await sock.sendMessage(jid, {
                document: { url: plugin.path },
                fileName: plugin.meta.fileName,
                mimetype: 'text/javascript',
                caption
            }, { quoted: q })
        }
    }

    else if (subCommand1 === "install" || subCommand1 === "i") {
        const isReplacePlugin = /-r/.test(splitString1.restString)

        if (!q) return await m.reply(`reply ke pesan dokumen file js atau pesan yang berisi kode plugin`)

        // kita harus normalize message karena kadang kalau kita coba kirim command dari wa web, itu path nya ada document with caption gitu
        const qNormalizeMessage = normalizeMessageContent(q.message)
        const qContentType = getContentType(qNormalizeMessage)

        if (qContentType === "documentMessage") {
            const qMime = qNormalizeMessage?.documentMessage?.mimetype
            const isValidMime = qMime === "text/javascript"
                || qMime === "application/javascript"
            if (!isValidMime) return await m.reply(`mime nya invalid. mime diterima ${qMime}`)

            const buffer = await q.download("buffer")
            const response = await pluginManager.install(buffer, isReplacePlugin)
            if (response.error) return await m.reply(response.error)
            menuManager.buildMenu()
            return await m.reply(response.data)
        } else if (qContentType === "conversation" || qContentType === "extendedTextMessage") {
            const buffer = Buffer.from(q.text)
            const response = await pluginManager.install(buffer, isReplacePlugin)
            if (response.error) return await m.reply(response.error)
            menuManager.buildMenu()
            return await m.reply(response.data)
        } else {
            return await m.reply("reply yang bener kocak")
        }
    }

    else if (subCommand1 === "install-url" || subCommand1 === "iu") {

        if (!splitString1.restString) return await m.reply(`mana urlnya? :v`)
        const url = splitString1.restString?.match(/https?:\/\/[^\s]+/g)
        if (!url) return await m.reply(`input url yang bener :v`)
        const isReplacePlugin = /-r/.test(splitString1.restString)

        try {
            const r = await fetch(url)
            if (!r.ok) throw Error(`fetch gagal ${r.status} ${r.statusText}`)
            const ab = await r.arrayBuffer()
            const buffer = Buffer.from(ab)
            const response = await pluginManager.install(buffer, isReplacePlugin)
            if (response.error) return await m.reply(response.error)
            menuManager.buildMenu()
            return await m.reply(response.data)
        } catch (e) {
            console.error(e)
            return await m.reply(`kesalaan\n${e.message}`)
        }
    }

    else if (subCommand1 === "uninstall" || subCommand1 === "u") {
        const r = await pluginManager.deletePlugin(splitString1.restString?.trim())
        if (r.error) return await m.reply(r.error)
        menuManager.buildMenu()
        return await m.reply(r.data)
    }

    else if (subCommand1 === "view" || subCommand1 === "v") {
        const param = splitString1.restString?.trim()
        const result = param === "protected" ? pluginManager.getProtectedPluginString()
            : param === "bypass" ? pluginManager.getBypassPluginString()
            : "opsi tersedia\n- protected\n- bypass"
        return await m.reply(result)
    }
}


/**@type {Plugin} */
const plugin = {
    run,
    name: "plugin manager",
    commands: ["plugin"],
    categories: ["core"],
}

plugin.description = 'tadaa'

plugin.meta = {
    fileName: "core-plugin-manager.js",
    author: "wolep",
    note: "restart kalau udh kebanyakan install / uninstall plugin ya.",
    version: "1"
}

plugin.config = {
    protected: true
}

export default plugin