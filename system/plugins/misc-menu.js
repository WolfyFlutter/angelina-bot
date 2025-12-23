import { pluginManager, sendText, sendFancyText, tag, pickRandom, botInfo, textOnlyMessage } from '../helper.js'

/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {

    // return return hm
    if (!textOnlyMessage(m)) return
    if (q) return

    const pc = `${prefix || ''}${command}`
    if (!text) {
        const header = `halo kak ${tag(m.senderId)} berikut kategori plugin yang tersedia\n\n`
        const content = pluginManager.forMenu.menuText
        const sampleCommand = `${pc} ${pickRandom(pluginManager.categoryArray)}`
        const footer = `\n\nketik *${sampleCommand}* buat buka menu`
        const print = header + content + footer
        return await sendFancyText(sock, jid, {
            text: print,
            title: botInfo.dn,
            body: botInfo.st,
            thumbnailUrlOrBuffer: botInfo.tm
        })
    }

    if (text === 'all') {
        const content = pluginManager.forMenu.menuAllText
        const sampleCommand = `${pickRandom(pluginManager.mapCatWithCmdArray.get(pickRandom(pluginManager.categoryArray))).cmd}`
        const footer = `\n\ngunakan param *-h* untuk mengetahui fungsi command.` +
            `\ncontoh: *${sampleCommand} -h*`
        const print = content + footer
        return await sendFancyText(sock, jid, {
            text: print,
            title: botInfo.dn,
            body: botInfo.st,
            renderLargerThumbnail: false,
            thumbnailUrlOrBuffer: botInfo.tm
        })
    }

    const validCategory = pluginManager.forMenu.category.get(text)
    if (!validCategory) return sendText(sock, jid, `maaf kak ${tag(m.senderId)}... menu dengan kategori *${text}* tidak tersedia`)
    const content = pickRandom(pluginManager.mapCatWithCmdArray.get(text)).cmd
    const footer = content ? `\n\ngunakan perintah *-h* untuk mengetahui fungsi command.` +
        `\ncontoh: *${content} -h*` : `\nwaduh kosong`
    const print = `${validCategory}${footer}`
    return await sendFancyText(sock, jid, {
        text: print,
        title: botInfo.dn,
        body: botInfo.st,
        renderLargerThumbnail: false,
        thumbnailUrlOrBuffer: botInfo.tm
    })
}

handler.pluginName = 'menu'
handler.description = 'command ini buat nampiin menu.\n' +
    'contoh penggunaan:\n' +
    'menu\n' +
    'menu <category>\n' +
    'menu all'
handler.command = ['menu']
handler.category = ['misc']

handler.config = {
    systemPlugin: true,
    antiDelete: true,
}

handler.meta = {
    fileName: 'menu.js',
    version: '1',
    author: botInfo.an,
    note: 'awawawa solid solid solid',
}

export default handler