import { Category } from '../helper.js'

/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {
    await sock.sendMessage(jid, {text: 'pong'}, {quoted: m})
}

handler.pluginName = 'ping'
handler.command = ['p']
handler.category = [Category.SYSTEM, Category.DEBUG]
export default handler