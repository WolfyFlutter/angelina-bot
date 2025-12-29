import { sendText, botInfo, updateDisplayName, userManager, textOnlyMessage } from '../helper.js'

/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {

    // return return
    if (!userManager.trustedJids.has(m.senderId)) return
    if (!textOnlyMessage(m)) return
    if (q) return

    if (!text?.trim()) return await sendText(sock, jid, `mana namanya wok? atau isi param -get buat dapetin current name`, m)
    const pc = `${prefix || ''}${command}`
    if (text && text.trim() === '-get') return await sendText(sock, jid, `${pc} ${botInfo.dn}`)
    updateDisplayName(text)
    await sendText(sock, jid, `display name updated! coba ketik menu`)
    return
}

handler.pluginName = 'display name update'
handler.description = 'command ini buat ngatur display name...\n' +
    'cara pakai:\n' +
    'dn angelina (buat set display name)\n' +
    'dn -get (buat dapetin current display name)'
handler.command = ['dn']
handler.category = ['built-in']

handler.config = {
    systemPlugin: true,
}

handler.meta = {
    fileName: 'display-name.js',
    version: '1',
    author: botInfo.an,
    note: 'ngihok',
}

export default handler