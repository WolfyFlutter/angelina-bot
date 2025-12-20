import { sendText, botInfo, updateDisplayName, userManager, textOnlyMessage } from '../helper.js'

/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {

    // return return
    if (!userManager.trustedJids.has(m.senderId)) return
    if (!textOnlyMessage(m, q)) return

    if (!text?.trim()) return await sendText(jid, `mana namanya wok`, m)
    if (text && text.trim() === 'get') return await sendText(jid, botInfo.displayName)
    updateDisplayName(text.trim())
    await sendText(jid, `display name updated! coba ketik menu`)
    return
}

handler.pluginName = 'update display name'
handler.description = 'command ini buat ngatur display name...\n' +
    'cara pakai:\n' +
    'dn angelina (buat set display name)\n' +
    'dn get (buat dapetin current display name)'
handler.command = ['dn']
handler.category = ['set']

handler.config = {
    systemPlugin: true,
    bypassPrefix: true,
    antiDelete: true,
}

handler.meta = {
    fileName: 'set-display-name.js',
    version: '1',
    author: botInfo.displayName,
    note: 'ngihok',
}

export default handler