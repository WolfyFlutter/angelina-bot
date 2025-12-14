import { sendText, tag, Category, pickWords, sendDocument, getBuff, } from '../../helper.js'
import { plugins, pluginsNoPrefix, loadPlugins, pluginsFilaName } from '../../plugin-handler.js'
import { user } from '../../../index.js'
import fs from 'node:fs'
import { allPath } from '../../static.js'

/**
 * @param {Object} params
 * @param {import("baileys").WASocket} params.sock
 */

//

const searchPlugin = (command) => {
    let handler = pluginsNoPrefix.get(command)
    if (handler) return handler
    return plugins.get(command)
}

async function handler({ sock, jid, text, m, q, prefix, command }) {
    if (!user.trustedJids.has(m.senderId)) return await sendText(jid, 'owner only')
    const prefixCommand = prefix || '' + command
    const act = ['get', 'install', 'uninstall', 'r']
    const print = '' +
        `${prefixCommand} ${act[0]} <command> [-d]\n` +
        `  contoh: ${prefixCommand} ${act[0]} ping \n` +
        `  _gunakan param -d untuk output dokumen_\n\n` +

        `${prefixCommand} ${act[1]} <filename.js> [-r]\n` +
        `  contoh: ${prefixCommand} ${act[1]} halo.js\n` +
        `  _gunakan param -r untuk force replace plugin_\n\n` +

        `${prefixCommand} ${act[2]} <command>\n` +
        `  contoh: ${prefixCommand} ${act[2]} ping\n\n` +

        `${prefixCommand} ${act[3]}\n` +
        `  contoh: ${prefixCommand} ${act[3]}`
    if (!text) return await sendText(jid, print, m)
    const param = pickWords(text)
    if (!act.includes(param[0])) return await sendText(jid, `param *${param[0]}* is invalid. please pick one of these param: ${act.join(', ')}`)

    // get
    if (param[0] === act[0]) {
        if (!param[1]) return await sendText(jid, `masukkan command. contoh: \`${prefixCommand} ${act[0]} ping\``)
        const handler = searchPlugin(param[1])
        if (!handler) return sendText(jid, `plugin dengan command *${param[1]}* tidak ditemukan`)
        if (param[2] === '-d') {
            const name = handler.pluginName
            const buff = fs.readFileSync(handler.dir)
            const fileName = handler.dir.split('/').pop()
            return await sendDocument(jid, buff, fileName, 'text/javascript', `nih plugin *${name}*`, q)
        } else {
            const text = fs.readFileSync(handler.dir) + ''
            return await sendText(jid, text, q)
        }
    }

    // install
    else if (param[0] === act[1]) {
        const tempFolder = './data/temp/'

        // dari teks
        if (!q) return sendText(jid, 'ketik dan kirim dulu plugin kamu ke chat. baru reply dengan command `' + (prefix || '') + command + ' install <nama-file.js>`')
        if (q.type === 'conversation' || q.type === 'extendedTextMessage' || q.type === 'documentMessage') {
            let content
            const filename = param[1]
            const forceReplace = param[2] === '-r'
            if (!/^[a-z-]+\.js$/g.test(filename)) return sendText(jid, 'missing file name. gunakan command seperti ini `' + (prefix || '') + command + ' install nama-plugin-kamu.js`')
            if (pluginsFilaName.includes(filename) && !forceReplace) return sendText(jid, 'nama plugin itu sudah ada. hapus dulu plugin nya yang ada di bot lalu install. atau ganti nama plugin baru mu dengan nama lain. atau gunakan command -r untuk force replace')

            // save file dari teks
            if (q.type === 'conversation' || q.type === 'extendedTextMessage') {
                content = q.text.trim()
            }

            // save file dari document
            else if (q.type === 'documentMessage') {
                content = await getBuff(q)
            }

            // lanjut cek filename, kalau ada sama dengan filename plugin yang udh ke install maka kasih error
            await fs.promises.writeFile(allPath.plugins + '/' + filename, content)
            const pluginFail = await loadPlugins()
            const print = `done!\nfail: ${pluginFail.length}\n${pluginFail.join('\n')}\n\npath itu bisa kamu replace dengan kode plugin yang benar ya.`
            return await sendText(jid, print, m)

        } else {
            return await sendText(jid, 'unsupported message type', m)
        }
    }

    // uninstall
    else if (param[0] === act[2]) {
        if (!param[1]) return await sendText(jid, `masukkan command. contoh: \`${prefixCommand} ${act[2]} ping\``)
        const handler = searchPlugin(param[1])
        if (!handler) return sendText(jid, `plugin dengan command *${param[1]}* tidak ditemukan`)
        const dir = handler.dir
        const name = handler.pluginName
        if(handler.preventDelete) return await sendText(jid, `plugin ${name} gak bisa di hapus`)
        await fs.promises.rm(dir)
        return await sendText(jid, `plugin ${name} berhasil di hapus.\ndir ${dir}`)
    }

    // reload
    else if (param[0] === act[3]) {
        const pluginFail = await loadPlugins()
        const print = `done!\nfail: ${pluginFail.length}\n${pluginFail.join('\n')}\n\npath itu bisa kamu replace dengan kode plugin yang benar ya.`
        return await sendText(jid, print, m)
    }

}

handler.preventDelete = true
handler.bypassPrefix = true
handler.pluginName = 'plugin manager'
handler.command = ['plugin']
handler.alias = []
handler.category = [Category.OWNER]
handler.help = 'plugin manager'

export default handler


