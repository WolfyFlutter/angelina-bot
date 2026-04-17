import { getContentType } from "baileys"

async function handler({ sock, m, q, text, jid, command, prefix }) {
    const ct = getContentType(m.message)
    const WAMC = {
        groupStatusMessageV2: {
            message: m.message[ct].contextInfo.quotedMessage
        }
    }
    let temp = WAMC
    return await sock.relayMessage(jid, temp, {})
}

handler.pluginName = 'swgc'
handler.description = 'swgc awo'
handler.command = ['swgc']
handler.category = ['example']

handler.meta = {
    fileName: 'swgc.js',
    version: '1',
    author: 'wolep',
    note: 'swgc ror',
}
export default handler