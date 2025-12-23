import { textOnlyMessage, sendText } from '../../system/helper.js'

/**
 * @param {import('../../system/types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {
    if (!textOnlyMessage(m)) return
    if (q) return
    if (text) return
    await sendText(sock, jid, `halo juga`, m)
    return
}

handler.pluginName = 'halo'
handler.description = 'deskripsi kamu'
handler.command = ['halo']
handler.category = ['test']

handler.meta = {
    fileName: 'halo.js',
    version: '1',
    author: 'ambatukam',
    note: 'ambasing',
}
export default handler