import { sendText, tag, Category } from '../helper.js'

/**
 * @param {Object} params
 * @param {import("baileys").WASocket} params.sock
 */

async function handler({ sock, jid, text, m, q, prefix, command }) {

    const header =   `hai!\n`
    const pushName = `pushname ${m.pushName}\n`
    const id =       `lid/pn   ${m.senderId}\n`
    const tagUser =  `tag      ${tag(m.senderId)}\n`
    const teksmu =   `text     ${text}\n`
    const prefixmu = `prefix   ${prefix}\n`
    const commandmu =`command  ${command}\n`
    const chatId   = `chat id  ${jid}`
    const print = '```' + header + pushName + id + tagUser + teksmu + prefixmu + commandmu + chatId + '```'
    return await sendText(jid, print, m)
}

handler.bypassPrefix = false
handler.pluginName = 'example title'
handler.command = ['example']
handler.alias = ['eg']
handler.category = [Category.OTHER]
handler.help = 'taruh deskripsi kamu disini'

export default handler


