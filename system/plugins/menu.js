import { pluginManager, sendText, sendFancyText, tag, pickRandom, botInfo, textOnlyMessage } from '../helper.js'

/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {

    // return return
    if (!textOnlyMessage(m, q)) return

    const pc = `${prefix || ''}${command}`
    if (!text) {
        const header = `halo kak ${tag(m.senderId)} berikut kategori plugin yang tersedia\n\n`
        const content = pluginManager.forMenu.menuText
        const sampleCommand = `${pc} ${pickRandom(pluginManager.categoryArray)}`
        const footer = `\n\ngunakan command *${pc} <category>* untuk melihat list command\ncontoh: \`${sampleCommand}\``
        const print = header + content + footer
        return await sendFancyText(jid, {
            text: print,
            title: botInfo.displayName,
            body: botInfo.secText
        })
    }

    if (text === 'all') {
        const content = pluginManager.forMenu.menuAllText
        const sampleCommand = `${pickRandom(pluginManager.mapCatWithCmdArray.get(pickRandom(pluginManager.categoryArray)))}`
        const footer = `\n\ngunakan perintah *<command> -h* untuk mengetahui fungsi command.\ncontoh: \`${sampleCommand} -h\``
        const print = content + footer
        return await sendFancyText(jid, {
            text: print,
            title: botInfo.displayName,
            body: botInfo.secText,
            renderLargerThumbnail: false
        })
    }

    const validCategory = pluginManager.forMenu.category.get(text)
    if (!validCategory) return sendText(jid, `maaf kak ${tag(m.senderId)}... menu dengan kategori *${text}* tidak tersedia`)
    const randomCmd3 = pickRandom(pluginManager.mapCatWithCmdArray.get(text))
    const randomHelp3 = randomCmd3 ? `\n\ngunakan perintah *<command> -h* untuk mengetahui fungsi command.\ncontoh: \`${randomCmd3} -h\`` : `\nwaduh kosong`
    const print = `${validCategory}${randomHelp3}`
    return await sendFancyText(jid, {
        text: print,
        title: botInfo.displayName,
        body: botInfo.secText,
        renderLargerThumbnail: false
    })
}

handler.pluginName = 'menu'
handler.description = 'command ini buat nampiin menu.\n' +
    'contoh penggunaan:\n' +
    '*menu*\n' +
    '*menu <category>*\n' +
    '*menu all*'
handler.command = ['menu']
handler.category = ['bot']

handler.config = {
    systemPlugin: true,
    bypassPrefix: true,
    antiDelete: true,
}

handler.meta = {
    fileName: 'menu.js',
    version: '1',
    author: botInfo.authorName,
    note: 'awawawa solid solid solid',
}

export default handler