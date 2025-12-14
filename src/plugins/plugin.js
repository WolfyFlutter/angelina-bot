import { sendText, tag, Category, pickWords, sendDocument, getBuff, } from '../helper.js'
import { plugins, pluginsNoPrefix, loadPlugins, pluginsFilaName } from '../plugin-handler.js'
import { user } from '../../index.js'
import fs from 'node:fs'

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
    if (!text) return await sendText(jid, `please read doc. use *${prefix || ''}${command} -h*`)
    const param = pickWords(text)
    const act = ['get', 'install', 'uninstall', 'reload']
    if (!act.includes(param[0])) return await sendText(jid, `param *${param[0]}* is invalid. please pick one of these param: ${act.join(', ')}`)

    // get
    if (param[0] === act[0]) {
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
            const filename = param[1]
            if (!/^[a-z-]+\.js$/g.test(filename)) return sendText(jid, 'missing file name. gunakan command seperti ini `' + (prefix || '') + command + ' install nama-plugin-kamu.js`')
            if(pluginsFilaName.includes(filename)) return sendText(jid, 'nama plugin itu sudah ada. hapus dulu plugin nya yang ada di bot lalu install. atau ganti nama plugin baru mu dengan nama lain.')

            // save file dari teks
            if (q.type === 'conversation' || q.type === 'extendedTextMessage') {
                await fs.promises.writeFile(tempFolder + filename, q.text.trim())
            }
            
            // save file dari document
            else if (q.type === 'documentMessage'){
                await fs.promises.writeFile(tempFolder + filename, await getBuff(q))
            }
            
            // hmm
            else {
                return await sendText(jid, 'unsupported message type', m)
            }

            // lanjut cek filename, kalau ada sama dengan filename plugin yang udh ke install maka kasih error
            const finalPath = tempFolder + filename

        }

        // dari file



    }

    // uninstall
    else if (param[0] === act[2]) {
        await sendText(jid, `kamu memilih ${act[2]}`, m)
        return
    }

    // reload
    else if (param[0] === act[3]) {
        await loadPlugins()
        await sendText(jid, `plugin sudah di reload`, m)
        return
    }

}

handler.bypassPrefix = true
handler.pluginName = 'plugin manager'
handler.command = ['plugin']
handler.alias = []
handler.category = [Category.OWNER]
handler.help = 'plugin manager'

export default handler


