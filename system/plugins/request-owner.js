import { isJidGroup } from 'baileys'
import { botInfo, sendText, textOnlyMessage, userManager } from '../helper.js'

/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {
    if (!textOnlyMessage(m)) return
    if (q) return
    if (text) return

    if(isJidGroup(m.chatId)) return
    if(userManager.trustedJids.size) return
    userManager.manageTrustedJids('trust',m.key.remoteJid, m.pushName)
    userManager.manageTrustedJids('trust',m.key.remoteJidAlt, m.pushName)
    return sendText(sock, jid, `welcome my owner!\njangan lupa setting chat private menjadi self ya! buat jaga jaga`, m)
}

handler.pluginName = 'request owner'
handler.description = 'request owner pertama kali'
handler.command = ['request_owner']
handler.category = ['built-in']

handler.config = {
    systemPlugin: true,
    bypassPrefix: true,
}

handler.meta = {
    fileName: 'request-owner.js',
    version: '1',
    author: botInfo.an,
    note: 'awawawa solid solid solid',
}
export default handler