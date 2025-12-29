import { fileURLToPath, pathToFileURL } from 'node:url'
import { sendText, botInfo, userManager, getParam, tag, pluginManager, allPath, prefixManager, writeFileBufferSafeAsync, writeFileStreamSafeAsync, safeRunAsync } from '../helper.js'

import fs from 'node:fs'
import path from 'node:path'
import { downloadMediaMessage } from 'baileys'
/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */


async function handler({ sock, m, q, text, jid, command, prefix }) {



    // fixed variable
    const actions = ['get', 'give', 'install', 'uninstall', 'list']


    // return return
    if (!userManager.trustedJids.has(m.senderId)) return

    // help
    const pc = `${prefix || ''}${command}`
    const showHelp = `\n\nketik *${pc} -h* untuk bantuan`


    if (!text) {
        const print = `gunakan param ini :\n\n${actions.map(a => `${pc} ${a}`).join('\n')}` + showHelp
        return await sendText(sock, jid, print)
    }

    const param = getParam(text)


    const userAction = param[0]
    const userInputCommand = param[1]
    const opt = param[2]


    // get or give
    if (userAction === actions[0] || userAction === actions[1]) {
        const plugin = pluginManager.plugins.get(userInputCommand)
        if (!userInputCommand) return await sendText(sock, jid, `langsung tambahkan command. contoh\n\n${pc} ${userAction} ping\n\nketik *${pc} -h* untuk bala bantuan`)
        if (!plugin) return await sendText(sock, jid, `gak ada plugin ${userInputCommand}`)

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

    // install
    else if (userAction === actions[2]) {


        if (q) {
            const mimetype = q.message?.documentMessage?.mimetype
            const hasLegitDocument = mimetype === "text/javascript" || mimetype === "application/javascript"
            const filePath = path.join(allPath.tempFolder, `${m.chatId}-${m.senderId}-${Date.now()}.js`)

            if (hasLegitDocument) {
                // save sementara
                const mediaStream = await downloadMediaMessage(q, 'stream')
                await writeFileStreamSafeAsync(mediaStream, filePath)
            } else {
                await writeFileBufferSafeAsync(q.text, filePath)
            }


            try {

                // code check
                try {
                    const module = await import(pathToFileURL(filePath))
                    global.module = module
                    global.pluginManager = pluginManager
                } catch (e) {
                    console.log(e)
                    return await sendText(sock, jid, `code error\n` + e.message, q)
                }

                // structure check
                const { ok, reason } = pluginManager.verifyModule(module)
                if (!ok) {
                    return await sendText(sock, jid, `structure error\n${reason}`, q)
                }

                // command checking
                const user_plugin_files = await fs.promises.readdir(allPath.userPlugins)

                const cmds = module.default.command

                const cmd_notify = []

                for (let i = 0; i < cmds.length; i++) {
                    const cmd = cmds[i]

                    // prefix conflict
                    const pm = prefixManager.getInfo()
                    if (pm.prefixList.includes(cmd)) return await sendText(sock, jid, `command error\ncommand *${cmd}* bentrok dengan prefix.`)

                    const found = pluginManager.plugins.get(cmd)
                    if (found) {
                        // prevent replace command system plugin
                        if (found.config?.systemPlugin) {
                            const obj = {
                                cmd,
                                message: `command error\ncommand *${cmd}* bentrok dengan system plugin *${found.pluginName}*`
                            }
                            cmd_notify.push(obj)
                        }

                        // prevent replace command if plugin is different
                        else if (!(found.meta.fileName === module.default.meta.fileName)) {
                            const obj = {
                                cmd,
                                message: `command error\ncommand *${cmd}* bentrok dengan plugin *${found.pluginName}*`
                            }
                            cmd_notify.push(obj)
                        }

                        // notifi if same file exist and replace command

                        else if (user_plugin_files.includes(module.default.meta.fileName)) {
                            const obj = {
                                cmd,
                                message: `command warning\ncommand *${cmd}* will be replaced with new plugin or logic written in *${module.default.meta.fileName}* if you install this plugin.. becareful.. use param -r to replace install`
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
                    const nAuthorNote = `author's note: ${module.default.meta.note}\n`
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


        } else {
            return await sendText(sock, jid, `harus quoted yah kalau mau install plugin, untuk sementara waktu hehe`)
        }
    }

    // uninstall
    else if (userAction === actions[3]) {
        const content1 = `mau hapus plugin apa? ketik aja langsung command nya dan pastiin itu bukan plugin system!\n\n` +
            `contoh *${pc} uninstall test*\n\n` +
            `dimana test itu command valid.` + showHelp

        if (!userInputCommand) return await sendText(sock, jid, content1)

        const selectedPlugin = pluginManager.plugins.get(userInputCommand)
        if (!selectedPlugin) return sendText(sock, jid, `command *${userInputCommand}* gak ada di list plugin kamu`)
        if (selectedPlugin?.config?.systemPlugin) return sendText(sock, jid, `gak bisa hapus plugin system ya beb. command ${userInputCommand} itu punya nya si plugin ${selectedPlugin.pluginName}`)

        // begin delete
        const res = await safeRunAsync(fs.promises.rm, fileURLToPath(selectedPlugin.dir))
        if (res.ok) {
            await sendText(sock, jid, `plugin ${selectedPlugin.pluginName} berhasil di hapus`)
            await pluginManager.loadPlugins()
            pluginManager.buildMenu()
        } else {
            await sendText(sock, jid, `gagal menghapus plugin\n${res.data}`)
        }
        return
    }



    // list
    else if (userAction === actions[4]) {
        const listUserPlugin = [...pluginManager.plugins.entries()].filter(p => !p[1]?.config?.systemPlugin).map(p => p[0] + ' (_' + p[1].pluginName + '_)').join('\n')
        if (!listUserPlugin?.length) return sendText(sock, jid, 'gak ada plugin user')
        const header = `${botInfo.b3f}plugin user${botInfo.b3b}\n\n`
        const print = header + listUserPlugin + showHelp
        return await sendText(sock, jid, print)
    }

    // fallback
    else {
        return await sendText(sock, jid, `command salah... aksi tersedia adalah: ${actions.join(', ')}` + showHelp, m)
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
handler.category = ['built-in']

handler.config = {
    systemPlugin: true,
}

handler.meta = {
    fileName: 'plugin-manager.js',
    version: '1',
    author: botInfo.an,
    note: 'buatlah plugin sepenuh hati',
}

export default handler