import { botInfo, textOnlyMessage } from '../helper.js'

/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {
    if (!textOnlyMessage(m, q)) return
    await sock.sendMessage(jid, { text: 'pong' }, { quoted: m })
}

handler.pluginName = 'ping'
handler.description = 'buat cek bot respond apa kagak.. simply just type ping'
handler.command = ['ping']
handler.category = ['bot']

handler.config = {
    systemPlugin: true,
    bypassPrefix: true,
    antiDelete: true,
}

handler.meta = {
    fileName: 'ping.js',
    version: '1',
    author: botInfo.authorName,
    note: 'awawawa solid solid solid',
}
export default handler