/**
 * @import {PluginCtx, Plugin} from "../types/types.js"
 */

import { getHttpStream, prepareWAMessageMedia } from "baileys"
import { getOneRandomElemenFrom, getFirstStringAndRest } from "../helper/common.js"

/**
 * fungsi buat generate kata kata :v
 * @param {string|undefined} displayPrefix 
 * @param {string|undefined} randomCommand 
 * @param {string|undefined} content 
 * @returns {string}
 */
const buatKataKata = (displayPrefix, randomCommand, content) => {
    return `${content ?? ''}

> gunakan command -h untuk melihat help.
> contoh: ${displayPrefix ?? ''}${randomCommand ?? ''} -h`
}

const checkUrl = (url) => {
    try {
        return new URL(url)?.toString()
    } catch (e) {
        return undefined
    }
}

/**
 * 
 * @param {PluginCtx} ctx 
 * @returns {Promise <any>}
 */
async function run(ctx) {
    const { sock, jid, m, text, prefix, command, pluginManager, menuManager, q, themeManager } = ctx

    const { firstString, restString } = getFirstStringAndRest(text)

    if (!text) {
        const themeConfig = themeManager.getData()

        const prefixCommand = `${prefix ?? ''}${command}`
        const randomCategory = getOneRandomElemenFrom(menuManager.categoryArray)
        const header = `hai ${m.contact.name || `kamu`}! berikut kategori yang tersedia\n\n`
        const body = menuManager.categoryText + '\n\n'
        const footer = `> gunakan ${prefixCommand} <category> untuk liat isi menu`
        const content = header + body + footer

        const _newThumbnailHeight = themeConfig?.thumbnailHeightRatioOverride 
        ? Math.floor(themeConfig?.message?.extendedTextMessage?.thumbnailHeight * themeConfig?.thumbnailHeightRatioOverride)
        : themeConfig?.message?.extendedTextMessage?.thumbnailHeight
        await sock.relayMessage(jid, {
            extendedTextMessage: {
                ...themeConfig?.message?.extendedTextMessage,
                "text": themeConfig?.url + "\n" + content,
                "matchedText": themeConfig?.url,
                "description": themeConfig?.description,
                "title": themeConfig?.title,

                thumbnailHeight: _newThumbnailHeight
            }
        }, {})
    }

    else if (firstString === "all" && !restString) {
        const randomCategory = getOneRandomElemenFrom(menuManager.categoryArray)
        const commandsInRandomCategory = menuManager.categoryMap.get(randomCategory).commandArray
        const randomCommand = getOneRandomElemenFrom(commandsInRandomCategory)
        const displayPrefix = pluginManager.getPlugin(randomCommand)?.config?.bypassPrefix ? '' : prefix ?? '' + ''
        return await sock.sendMessage(jid, {
            text: buatKataKata(displayPrefix, randomCommand, menuManager.allMenuText)
        })
    }

    else {
        // validate user input about menu category
        const userCategory = text.trim()
        const choosenCategory = menuManager.categoryMap.get(userCategory)
        if (!choosenCategory) return await m.reply(`tidak ada kategori *${text}*`)

        // kalau ada kategori valid
        const randomCommand = getOneRandomElemenFrom(choosenCategory.commandArray)
        const displayPrefix = pluginManager.getPlugin(randomCommand)?.config?.bypassPrefix ? '' : prefix ?? '' + ''
        return await sock.sendMessage(jid, {
            text: buatKataKata(displayPrefix, randomCommand, choosenCategory?.finalText)
        })
    }
}

/**@type {Plugin} */
const plugin = {
    run,
    name: "menu",
    commands: ["menu"],
    categories: ["core"],
    description: "menampilkan menu",
}

plugin.meta = {
    fileName: "core-menu.js",
    author: "wolep",
    note: "baru belajar bikin base",
    version: "1"
}

plugin.config = {
    protected: true
}

export default plugin