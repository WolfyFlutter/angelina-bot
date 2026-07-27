import { Interactive } from "../helper/sendInteractive.js"
/** @import {PluginCtx, Plugin} from "../types/types.js" */

/**
 * @param {PluginCtx} ctx 
 * @returns {Promise <any>}
 */
async function run(ctx) {
    const { m, q, sock, jid, pluginAccessManager } = ctx

    // api hit, cuma ambil gambar yang size nya <= 2 megabyte
    const response = await fetch('https://api.waifu.im/images?ByteSize=<=597152')
    if (!response.ok) throw Error(`${response.status} ${response.statusText}`)

    // pick up value and early return
    const json = await response.json()
    const url = json.items[0]?.url
    if (!url) throw Error(`url nya kosong`)
    const source = json.items[0]?.source || 'unknown'

    // message send
    const msg = new Interactive(sock)
    msg.setHeader({
        image: { url }
    }).setBody(`ini waifunya ${m.pushName}`)
        .addButtonQuickReply('lagi', 'waifu')
        .setButtonLimit(2, { buttonTitle: `opsi lain`, listTitle: `pilih` })
    if (pluginAccessManager.ownerList.has(m.contact.secondaryId)) msg.addButtonQuickReply(`jadikan thumbnail menu`, `theme thumb set ${url}`)
    if (source) {
        msg.setFooter(source)
    }

    msg.send(jid, {
        quoted: m
    })
}

/** @type {Plugin} */
const plugin = { run }

plugin.name = "random waifu"
plugin.commands = ["waifu"]
plugin.categories = ["other"]
plugin.description = "get random waifu. thanks to https://docs.waifu.im/"

plugin.meta = {
    fileName: "get-random-waifu.js",
    version: "1",
    author: "wolep",
    note: "jangan di pakai ritual",
    url: 'https://docs.waifu.im/'
}

plugin.config = {
    removeFirstUrl: true
}

export default plugin