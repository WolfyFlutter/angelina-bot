import { sendText, botInfo, updateSecondaryText, userManager, textOnlyMessage } from '../helper.js'

/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {

    // return return
    if (!userManager.trustedJids.has(m.senderId)) return
    if (!textOnlyMessage(m, q)) return

    if (!text?.trim()) return await sendText(jid, `mana namanya wok`, m)
    if (text && text.trim() === 'get') return await sendText(jid, botInfo.secText)
    updateSecondaryText(text.trim())
    await sendText(jid, `secondary text updated! coba ketik menu`)
    return
}

handler.pluginName = 'update secondary text'
handler.description = 'command ini buat ngatur secondary text...\n' +
    'cara pakai:\n' +
    'st angelina (buat set display name)\n' +
    'st get (buat dapetin current display name)'
handler.command = ['st']
handler.category = ['set']

handler.config = {
    systemPlugin: true,
    bypassPrefix: true,
    antiDelete: true,
}

handler.meta = {
    fileName: 'set-secondary-text.js',
    version: '1',
    author: botInfo.displayName,
    note: 'awuuuuu',
}

export default handler