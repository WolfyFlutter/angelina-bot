import { sendText, botInfo, tag } from '../helper.js'

/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {

    if (!text) return await sendText(sock, jid, 'isikan alasan', m)
    if (!global.afk) global.afk = {}
    if (!global.afk[m.chatId]) global.afk[m.chatId] = {}
    global.afk[m.chatId][m.senderId] = {
        time: Date.now(),
        reason: text,
        IMessage: []
    }
    return await sendText(sock, jid, `${tag(m.senderId)} afk dengan alasan ${text}`)
}

handler.pluginName = 'afk'
handler.description = 'ini adalah fitur afk. ketika kamu mengaktifkan fitur ini.. siapapun yang tag kamu di dalam grup chat akan di balas oleh bot di reply dengan pesan alasan kamu afk. setiap group punya afknya masing masing. fitur ini owner only ya :v\n\n' +
    'cara pakai:\n' + 
    'afk\n'+
    'afk ngoding'
handler.command = ['afk']
handler.category = ['system']

handler.config = {
    systemPlugin: true,
    bypassPrefix: true,
    preventDelete: true,
}

handler.meta = {
    fileName: 'system-afk.js',
    version: '1',
    author: botInfo.an,
    note: 'malas',
}

export default handler