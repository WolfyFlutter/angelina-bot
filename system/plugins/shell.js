import { sendText, botInfo, userManager, textOnlyMessage } from '../helper.js'
import { exec } from 'node:child_process'
import util from 'node:util'

const execPromise = util.promisify(exec)


/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {


    // return return hm
    if (!userManager.trustedJids.has(m.senderId)) return
    if (!textOnlyMessage) return
    try {
        const { stderr, stdout } = await execPromise(text)
        let output = stdout || stderr || '✅ Tidak ada output.'
        if (output.length > 1000) output = output.substring(0, 1000) + '\n\n[Output terpotong...]'
        await sendText(sock, jid, output.trim(), m)
    } catch (e) {
        await sendText(sock, jid, `❌ Error:\n${e.message}`, m)
    }
}

handler.pluginName = 'shell'
handler.description = 'panggil shell/terminal'
handler.command = ['$']
handler.category = ['built-in']

handler.config = {
    systemPlugin: true,
    bypassPrefix: true,
}

handler.meta = {
    fileName: 'shell.js',
    version: '1',
    author: botInfo.an,
    note: 'debag debug',
}

export default handler