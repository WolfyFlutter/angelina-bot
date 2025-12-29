import { tag, sendText, textOnlyMessage } from '#helper'

/**
 * @param {import('../../system/types/plugin').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {
    return await sock.sendMessage(jid, {text: 'hai juga!'},{quoted: m})
}

handler.pluginName = 'hai example'
handler.description = 'hai'
handler.command = ['hai']
handler.category = ['example']

handler.meta = {
    fileName: 'example.js',
    version: '1',
    author: 'wolep',
    note: 'plugin example note',
}
export default handler