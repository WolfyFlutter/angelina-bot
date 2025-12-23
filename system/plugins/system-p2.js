import { botInfo, textOnlyMessage } from '../helper.js'

/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {
    if (!textOnlyMessage(m)) return
    if (q) return
    if (text) return

    const start = Date.now()
    const pr = await sock.sendMessage(jid, { text: "wait..." })
    const end = Date.now()
    const result = `ping time: ${end - start}ms`
    await sock.sendMessage(jid, {text: result, edit: pr.key})
    return
}

handler.pluginName = 'ping 2'
handler.description = 'sama kaya ping.. tapi ada durasi delay sendMessage'
handler.command = ['p2']
handler.category = ['system']

handler.config = {
    systemPlugin: true,
    bypassPrefix: true,
    antiDelete: true,
}

handler.meta = {
    fileName: 'ping.js',
    version: '1',
    author: botInfo.an,
    note: 'awawawa solid solid solid',
}
export default handler