import { sendText, botInfo, updateThumbnailMenu, userManager, textOnlyMessage, extractUrl } from '../helper.js'

/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {

    // return return
    if (!userManager.trustedJids.has(m.senderId)) return
    if (q) return


    if (!text?.trim()) return await sendText(sock, jid, `mana urlnya wok`, m)
    const pc = `${prefix || ''}${command}`
    if (text && text.trim() === 'get') return await sendText(sock, jid, `${pc} ${botInfo.tm}`)

    // cek dulu
    const urls = extractUrl(text)
    if (!urls.length) return await sendText(sock, jid, `invalid url`, m)
    const r = await fetch(text, { method: 'head' })
    if (!r.ok) return await sendText(sock, jid, `url nya gak ok nih. ganti yang lain`, m)
    if (!/^image/.test(r.headers.get('content-type'))) return await sendText(sock, jid, `url valid sih.. tapi bukan image. no change`, m)
    updateThumbnailMenu(text)
    await sendText(sock, jid, `thumbnail menu updated! coba ketik menu`)
    return
}

handler.pluginName = 'update thumbnail menu'
handler.description = 'command ini buat ngatur thumbnail menu...\n' +
    'cara pakai:\n' +
    'tm <url> (buat set display name)\n' +
    'tm get (buat dapetin current display name)'
handler.command = ['tm']
handler.category = ['theme']

handler.config = {
    systemPlugin: true,
    antiDelete: true,
}

handler.meta = {
    fileName: 'set-thumbnail-menu.js',
    version: '1',
    author: botInfo.an,
    note: 'pilihlah thumbnail yang seksi',
}

export default handler