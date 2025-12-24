import { fileURLToPath } from 'node:url'
import { sendText, botInfo, textOnlyMessage, prefixManager, pluginManager, userManager, getParam, tag, safeRunSync, safeRun } from '../helper.js'
import mime from 'mime-types'

import fs from 'node:fs'
import path from 'node:path'
import { downloadContentFromMessage, downloadMediaMessage } from 'baileys'

/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */


async function handler({ sock, m, q, text, jid, command, prefix }) {

    // fixed variable
    const actions = ['get', 'install', 'uninstall', 'give']


    // return return
    if (!userManager.trustedJids.has(m.senderId)) return

    const pc = `${prefix || ''}${command}`

    if (!text) return await sendText(sock, jid, 'waduh', m)
    const param = getParam(text)


    // get

    const userAction = param[0]
    const userPlugin = param[1]
    const opt = param[2]
    if (userAction === actions[0] || userAction === actions[3]) {
        const plugin = pluginManager.plugins.get(userPlugin)
        if (!plugin) return await sendText(sock, jid, `gak ada plugin ${userPlugin}`)

        const caption = q ? `kamu diberikan plugin *${plugin.pluginName}* oleh ${tag(m.senderId)}` : `nih plugin *${plugin.pluginName}* nya`
        const filePath = fileURLToPath(plugin.dir)
        const fileName = path.basename(filePath)
        const mimetype = mime.lookup(filePath) || 'application/octet-stream'

        if (!opt) {
            await sock.sendMessage(jid, {
                document: { url: filePath },
                mimetype,
                fileName,
                caption
            }, { quoted: q || m })
            return
        }

        else if (opt === '-t') {
            const text = await fs.promises.readFile(filePath)
            await sendText(sock, jid, text + '', m)
            return
        }
    }

    // install
    if (userAction === actions[1]) {
        if (!q.message?.documentMessage?.mimetype === "text/javascript") return sendText(sock, jid, `reply ke media message yang file js`)
        const media = await safeRun(downloadMediaMessage, q, 'buffer')
        if (!media.ok) return sendText(sock, jid, `ada masalah saat download mdia`)
        await sendText(sock, jid, media.data + '', m)
        return
    }

    // fallback
    else {
        return await sendText(sock, jid, `command salah`, m)
    }

}

handler.pluginName = 'prefix manager'
handler.description = 'command ini buat manage prefix.\n' +
    'contoh penggunaan:\n' +
    'prefix on (hidupkan prefix)\n' +
    'prefix off (non aktifkan prefix)\n' +
    'prefix add <prefix> (nambah prefix)\n' +
    'prefix del <indexPrefix|prefix> (hapus prefix>'
handler.command = ['plugin']
handler.category = ['manager']

handler.config = {
    systemPlugin: true,
    bypassPrefix: true,
    antiDelete: true,
}

handler.meta = {
    fileName: 'manager-prefix.js',
    version: '1',
    author: botInfo.an,
    note: 'i like no prefix',
}

export default handler