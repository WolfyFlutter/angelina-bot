import { sendText, botInfo, updateThumbnailMenu, userManager, textOnlyMessage, extractUrl,tag } from '../../system/helper.js'

/**
 * @param {import('../../system/types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {

    if (!text) return await sendText(sock,jid, 'isikan alasan', m )
    if(!global.afk) global.afk = {}
    global.afk[m.senderId] = {
        time: Date.now(),
        reason: text
    }
    return await sendText(sock, jid, `${tag(m.senderId)} afk dengan alasann ${text}`)
}

handler.pluginName = 'test afk fitur'
handler.description = 'afk uwu'
handler.command = ['afk']
handler.category = ['test']

handler.meta = {
    fileName: 'set-thumbnail-menu.js',
    version: '1',
    author: botInfo.an,
    note: 'malas',
}

export default handler