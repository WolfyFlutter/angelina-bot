import { textOnlyMessage, sendText } from '../../system/helper.js'

/**
 * @param {import('../../system/types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {
    // get data
    const api = 'https://placewaifu.com/image'
    const r = await fetch(api)
    if(!r.ok) return sendText(sock, jid, 'request not ok', m)
    const data = await r.text()
    const match_buffer = data.match(/base64,(.+?)"/)?.[1]
    if (!match_buffer) return sendText(sock, jid, 'gagal mendapatkan buffer')
    const buffer = Buffer.from(match_buffer,'base64')
    await sock.sendMessage(jid, {image: buffer})
    return
}

handler.pluginName = 'place waifu'
handler.description = 'dapatkan gambar waifu'
handler.command = ['placewaifu']
handler.category = ['test']

handler.meta = {
    fileName: 'halo.js',
    version: '1',
    author: 'ambatukam',
    note: 'ambasing',
}
export default handler