import { botInfo, textOnlyMessage, userManager } from '#helper'

/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {
    if (!textOnlyMessage(m)) return
    if (q) return
    if (!userManager.trustedJids.has(m.senderId)) return

        process.exitCode = 1000
        process.exit()
}

handler.pluginName = 'ping'
handler.description = 'buat cek bot respond apa kagak.. simply just type ping'
handler.command = ['restart']
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