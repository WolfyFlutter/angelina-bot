import { sendText, botInfo, tag, userManager, textOnlyMessage } from '../helper.js'

/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {

    if (!userManager.trustedJids.has(m.senderId)) return
    if (!text) return await sendText(sock, jid, 'isikan alasan', m)
    if (!textOnlyMessage(m)) return
    
    if (!global.afk) global.afk = {}
    if (!global.afk[m.chatId]) global.afk[m.chatId] = {}
    global.afk[m.chatId][m.senderId] = {
        time: Date.now(),
        reason: text,
        IMessage: []
    }
    return await sendText(sock, jid, `${tag(m.senderId)} afk dengan alasan ${text}`)
}

handler.pluginName = 'away from keyboard'
handler.description = 'ini adalah fitur afk. ketika kamu mengaktifkan fitur ini.. siapapun yang tag kamu di dalam grup chat akan di balas oleh bot di reply dengan pesan alasan kamu afk. setiap group punya afknya masing masing. fitur ini owner only ya :v\n\n' +
    'cara pakai\n' + 
    'afk <isi_alasan>\n'+
    'afk ngoding'
handler.command = ['afk']
handler.category = ['built-in']

handler.config = {
    systemPlugin: true,
}

handler.meta = {
    fileName: 'afk.js',
    version: '1',
    author: botInfo.an,
    note: 'malas',
}

export default handler