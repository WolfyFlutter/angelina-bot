import { areJidsSameUser, getContentType, normalizeMessageContent } from "baileys"
import fs from "node:fs"
import { getFirstStringAndRest } from "../helper/common.js"

/**
 * @import {PluginCtx, Plugin} "../types/types.js"
 * @typedef {"get" | "g" | "install" | "i" | "install-url" | "iu" | "uninstall" | "u" | "view" | "v"} SubCommand1
 */

/**@param { PluginCtx } ctx */
async function run(ctx) {
    const { sock, jid, m, q, text, prefix, command, pluginManager, menuManager } = ctx
    const prefixCommand = `${prefix ?? ''}${command}`

    if (!text) return await m.reply(`command :
- get <cmd> [-t]
- install [-r] (reply)
- install-url <url> [-r]
- uninstall <cmd>
- view <protected | bypass>

ketik ${prefixCommand} -help untuk bantuan.`)

    const splitString1 = getFirstStringAndRest(text)

    /**@type {SubCommand1} */
    const subCommand1 = splitString1.firstString
    const restString1 = splitString1.restString

    if (subCommand1 === "get" || subCommand1 === "g") {
        const splitString2 = getFirstStringAndRest(restString1)
        const cmd = splitString2.firstString
        if (!cmd) return await m.reply(`masukkan command plugin yang ingin di get. contoh ${prefixCommand} get ping. untuk output teks bisa tambahkan param -t, jadi ${prefixCommand} get ping -t`)

        const plugin = pluginManager.getPlugin(cmd)
        if (!plugin) return await m.reply(`gak ada plugin dengan command ${cmd}`)

        if (plugin?.config?.preventShare) return await m.reply(`sorry, plugin ${plugin.name} adalah privte, cant share it T^T`)

        const wam = m.button ? m
            : q ? q
                : m

        const captionGiven = `kamu di berikan plugin *${plugin.name}* oleh ${m?.contact?.name}`
        const captionSelf = `nih plugin *${plugin.name}* nya`
        const caption = m.button ? captionSelf
            : areJidsSameUser(m.sender, q?.sender) ? captionSelf
            : !q ? captionSelf : captionGiven

        // options
        const additionalParam = splitString2.restString
        const sendAsText = /-t/.test(additionalParam)

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
            }, { quoted: !q ? undefined : wam })
        }
    }

    else if (subCommand1 === "install" || subCommand1 === "i") {
        if (!q) return await m.reply(`reply ke pesan dokumen file js atau pesan yang berisi kode plugin`)
        const isReplacePlugin = /-r/.test(splitString1.restString)

        // kita harus normalize message karena kadang kalau kita coba kirim command dari wa web, itu path nya ada document with caption gitu
        const qNormalizeMessage = normalizeMessageContent(q.message)
        const qContentType = getContentType(qNormalizeMessage)

        if (qContentType === "documentMessage") {
            const qMime = qNormalizeMessage?.documentMessage?.mimetype
            const isValidMime = qMime === "text/javascript" || qMime === "application/javascript"
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
            return await m.reply("reply yang bener :v")
        }
    }

    else if (subCommand1 === "install-url" || subCommand1 === "iu") {
        let url
        if (q) {
            if (!q.text) return await q.reply(`reply ke pesan yang ada teks nya ${m.contact.name}`)
            url = q.text?.match(/https?:\/\/[^\s]+/g)
            if (!url) return await q.reply(`tidak bisa menemukan url disini ${m.contact.name}`)
        } else {
            if (!splitString1.restString) return await m.reply(`mana urlnya? :v`)
            url = splitString1.restString?.match(/https?:\/\/[^\s]+/g)
            if (!url) return await m.reply(`input url yang bener :v`)
        }
        const isReplacePlugin = /-r/.test(splitString1.restString)
        let buffer
        try {
            const r = await fetch(url)
            if (!r.ok) throw Error(`fetch gagal ${r.status} ${r.statusText}`)
            const ab = await r.arrayBuffer()
            buffer = Buffer.from(ab)
        } catch (e) {
            console.error(e)
            return await m.reply(`fetch fail\n${e.message}`)
        }
        const response = await pluginManager.install(buffer, isReplacePlugin)
        if (response.error) return await m.reply(response.error)
        menuManager.buildMenu()
        return await m.reply(response.data)
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

    else {
        return await m.reply(`invalid subcommand. gunakan ${prefixCommand} -h untuk bantuan`)
    }
}

/**@type {Plugin} */
const plugin = {
    run,
    name: "plugin manager",
    commands: ["plugin"],
    categories: ["core"],
    description: 'full dokumentasi https://github.com/WolfyFlutter/angelina-bot#plugin-manager'
}

plugin.meta = {
    fileName: "core-plugin-manager.js",
    author: "wolep",
    note: "restart kalau udh kebanyakan install / uninstall plugin ya.",
    version: "1",
    url: 'https://github.com/WolfyFlutter/angelina-bot#plugin-manager'
}

plugin.config = {
    protected: true,
    removeFirstUrl: true
}

export default plugin