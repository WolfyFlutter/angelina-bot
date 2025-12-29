import { botInfo, textOnlyMessage, userManager, allPath, writeFileBufferSafeAsync, sendText } from '#helper'
import { proto } from 'baileys'
import path from 'node:path'
/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix, IWMI }) {
    if (!textOnlyMessage(m)) return
    if (q) return
    if (!userManager.trustedJids.has(m.senderId)) return

    await sendText(sock, jid, `killing the old me... my pid: ${process.pid}`)
    const buff = proto.WebMessageInfo.encode(IWMI).finish()
    const dest = path.join(allPath.tempFolder, 'message-restart.bin')
    await writeFileBufferSafeAsync(buff, dest)
    process.exitCode = 1
    process.exit()

}

handler.pluginName = 'restart bot process'
handler.description = 'heap dan rss gede? simply type restart buat kill process dan mulai ulang. runtime kalian gak akan ke reset karena process utama masih running.'
handler.command = ['restart']
handler.category = ['built-in']

handler.config = {
    systemPlugin: true,
}

handler.meta = {
    fileName: 'restart.js',
    version: '1',
    author: botInfo.an,
    note: 'awawawa solid solid solid',
}
export default handler