import { botInfo, textOnlyMessage , formatByte, sendText} from '../helper.js'

/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {
    if (!textOnlyMessage(m)) return
    if (q) return
    if (text) return

    const formatMemory = (mem) => {
        const rss = `rss: ${formatByte(mem.rss)}\n`
        const ht = `heap total: ${formatByte(mem.heapTotal)}\n`
        const hu = `heap used: ${formatByte(mem.heapUsed)}\n`
        const e = `external: ${formatByte(mem.external)}\n`
        const ab = `array buffers: ${formatByte(mem.arrayBuffers)}`
        const print = rss + ht + hu + e + ab
        return print
    }

    if (!text) {
        const mem = process.memoryUsage()
        const print = formatMemory(mem)
        return await sendText(sock, jid, print, m)
    }
}

handler.pluginName = 'memory usage'
handler.description = 'cek memory usage node js'
handler.command = ['mem']
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