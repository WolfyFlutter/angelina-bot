import { Category as C, editText } from '../helper.js'

/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {
    const start = Date.now()
    const pr = await sock.sendMessage(jid, { text: "wait..." })
    const end = Date.now()
    const result = `ping time: ${end - start}ms`
    editText(jid, pr, result)
    return
}



handler.pluginName = 'ping v2'
handler.command = ['p2']
handler.category = [C.SYSTEM, C.DEBUG]
export default handler