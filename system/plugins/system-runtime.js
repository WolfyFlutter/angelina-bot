import { botInfo, textOnlyMessage, formatByte, sendText, msToReadableTime } from '../helper.js'

/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {
    if (text) return
    if (q) return
    if (!textOnlyMessage(m)) return

    process.send({
        type: 'uptime',
        data: { jid }
    })
    return
}

handler.pluginName = 'cek runtime bot'
handler.description = 'cek runtime bot'
handler.command = ['rt']
handler.category = ['system']

handler.config = {
    systemPlugin: true,
    preventDelete: true,
}

handler.meta = {
    fileName: 'system-runtime.js',
    version: '1',
    author: botInfo.an,
    note: 'bisa yok 1 hari lebih',
}
export default handler