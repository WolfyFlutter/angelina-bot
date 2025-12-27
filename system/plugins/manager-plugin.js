import { fileURLToPath, pathToFileURL } from 'node:url'
import { sendText, botInfo, userManager, getParam, tag, pluginManager, allPath, safeRun, safeRunSync, prefixManager, writeFileSafe, writeFileStreamSafe } from '../helper.js'
import mime from 'mime-types'

import fs from 'node:fs'
import path from 'node:path'
import { downloadContentFromMessage, downloadMediaMessage } from 'baileys'
import { promises } from 'node:stream'
/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */


async function handler({ sock, m, q, text, jid, command, prefix }) {



    // fixed variable
    const actions = ['get', 'install', 'uninstall', 'give', 'check']


    // return return
    if (!userManager.trustedJids.has(m.senderId)) return

    const pc = `${prefix || ''}${command}`

    if (!text) return await sendText(sock, jid, 'waduh', m)
    const param = getParam(text)


    // get  
    const userAction = param[0]
    const userInputPlugin = param[1]
    const opt = param[2]
    if (userAction === actions[0] || userAction === actions[3]) {
        const plugin = pluginManager.plugins.get(userInputPlugin)
        if (!plugin) return await sendText(sock, jid, `gak ada plugin ${userInputPlugin}`)

        const caption = q ? `kamu diberikan plugin *${plugin.pluginName}* oleh ${tag(m.senderId)}` : `nih plugin *${plugin.pluginName}* nya`
        const filePath = fileURLToPath(plugin.dir)
        const fileName = path.basename(filePath)
        const mimetype = 'application/javascript'

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

    // // install
    // if (userAction === actions[1]) {
    //     if (q) {
    //         const hasLegitDocument = q.message?.documentMessage?.mimetype === "text/javascript"
    //         if (hasLegitDocument) {

    //         } else if (hasUrls.length) {

    //         }
    //     }

    //     else {

    //     }
    //     // const urls = extractUrl()
    //     // if (!q.message?.documentMessage?.mimetype === "text/javascript") return sendText(sock, jid, `reply ke media message yang file js`)
    //     // const media = await safeRun(downloadMediaMessage, q, 'buffer')
    //     // if (!media.ok) return sendText(sock, jid, `ada masalah saat download mdia`)
    //     // await sendText(sock, jid, media.data + '', m)
    //     // return
    // }

    // install
    if (userAction === actions[1]) {


        if (q) {
            const mimetype = q.message?.documentMessage?.mimetype
            const hasLegitDocument = mimetype === "text/javascript" || mimetype === "application/javascript"
            const filePath = path.join(allPath.temp, `${m.chatId}-${m.senderId}-${Date.now()}.js`)

            if (hasLegitDocument) {
                // save sementara
                const mediaStream = await downloadMediaMessage(q, 'stream')
                await writeFileStreamSafe(mediaStream, filePath)
            } else {
                await writeFileSafe(filePath, q.text)
                console.log('here', q.text)
            }


            try {
                console.log('here', filePath)
                //return

                // code check
                try {
                    const module = await import(pathToFileURL(filePath))
                    global.module = module
                    global.pluginManager = pluginManager
                } catch (e) {
                    await fs.promises.rm(filePath)
                    console.log(e)
                    return await sendText(sock, jid, `code error\n` + e.message, q)
                }

                // structure check
                const { ok, reason } = pluginManager.verifyModule(module)
                if (!ok) {
                    return await sendText(sock, jid, `structure error: ${reason}`, q)
                }

                // command checking
                const user_plugin_files = await fs.promises.readdir(allPath.userPlugins)
                console.log(user_plugin_files)
                console.log(module.default.meta.fileName)

                const cmds = module.default.command

                const cmd_notify = []

                for (let i = 0; i < cmds.length; i++) {
                    const cmd = cmds[i]

                    // prefix conflict
                    const pm = prefixManager.getInfo()
                    if (pm.prefixList.includes(cmd)) return await sendText(sock, jid, `command error: command *${cmd}* bentrok dengan prefix.`)

                    const found = pluginManager.plugins.get(cmd)
                    if (found) {
                        // prevent replace command system plugin
                        if (found.config?.systemPlugin) {
                            const obj = {
                                cmd,
                                message: `command error: command *${cmd}* bentrok dengan system plugin *${found.pluginName}*`
                            }
                            cmd_notify.push(obj)
                        }

                        // prevent replace command if plugin is different
                        else if (!(found.meta.fileName === module.default.meta.fileName)) {
                            const obj = {
                                cmd,
                                message: `command error: command *${cmd}* bentrok dengan plugin *${found.pluginName}*`
                            }
                            cmd_notify.push(obj)
                        }

                        // notifi if same file exist and replace command

                        else if (user_plugin_files.includes(module.default.meta.fileName)) {
                            const obj = {
                                cmd,
                                message: `command warning\ncommand *${cmd}* will updated in *${module.default.meta.fileName}* if you install this plugin.. becareful.. use param -r to force install`
                            }
                            cmd_notify.push(obj)
                        }
                    }

                }

                console.log(cmd_notify)
                const dest = path.join(allPath.userPlugins, module.default.meta.fileName)
                if (cmd_notify.length) {
                    const result = cmd_notify.map(v => v.message).join('\n\n')
                    if (!(param[1] === '-r')) return await sendText(sock, jid, result, q)
                    await fs.promises.copyFile(filePath, dest)
                    await pluginManager.loadPlugins()
                    pluginManager.buildMenu()
                    const headers = `sukses!\n`
                    const nCommand = `command: ${module.default.command.join(", ")}\n`
                    const nDir = `dir: ${dest}`
                    const nAuthor = `author: ${module.default.meta.author}\n`
                    const nAuthorNote = `author: ${module.default.meta.note}\n`
                    const nVersion = `version: ${module.default.meta.version}\n`
                    const print = headers + nCommand + nAuthor + nAuthorNote + nVersion + nDir
                    return await sendText(sock, jid, `${print}`, q)
                }


                await fs.promises.copyFile(filePath, dest)
                await pluginManager.loadPlugins()
                pluginManager.buildMenu()
                return await sendText(sock, jid, 'sukses \n', q)
            } catch (_) {
                console.log('error', _)
            } finally {
                console.log(filePath)
                await fs.promises.rm(filePath)
            }


        }
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