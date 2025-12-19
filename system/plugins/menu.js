import { pluginManager, sendText, sendFancyText, tag, bot, pickRandom } from '../helper.js'

/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {
    const pc = `${prefix || ''}${command}`
    if (!text) {
        const header = `halo kak ${tag(m.senderId)}! berikut daftar menu yang tersedia\n\n`
        const content = pluginManager.forMenu.menuText
        const footer = `\n\ngunakan *command ${pc} <category>* untuk melihat list command\ncontoh: \`${pc} ${pickRandom(pluginManager.categoryArray)}\``
        const print = header + content + footer
        return await sendFancyText(jid, {
            text: print,
            title: bot.displayName
        })
    }

    if (text === 'all') {
        const content = pluginManager.forMenu.menuAllText
        const footer = `\n\ngunakan *command ${pc} <category>* untuk melihat list command\ncontoh: \`${pc} ${pickRandom(pluginManager.categoryArray)}\``
        const print = content + footer
        return await sendFancyText(jid, {
            text: print,
            title: bot.displayName

        })
    }

    const validCategory = pluginManager.forMenu.category.get(text)
    if (!validCategory) return sendText(jid, `maaf kak ${tag(m.senderId)}... menu dengan kategori *${text}* tidak tersedia`)
    const randomCmd3 = pickRandom(pluginManager.mapCatWithCmdArray.get(text))
    const randomHelp3 = randomCmd3 ? `\n\ngunakan perintah *<command> -h* untuk mengetahui fungsi command.\ncontoh: \`${randomCmd3} -h\`` : `\nwaduh kosong`
    const print3 = `${validCategory}${randomHelp3}`
    return await sendFancyText(jid, {
        text: print3,
        title: bot.displayName,
        renderLargerThumbnail: false
    })
}

// essensial
handler.pluginName = 'menu'
handler.description = 'malas nulis deskripsi'
handler.command = ['menu']
handler.category = ['system','cihuy']

handler.config = {
    bypassPrefix: true,
    preventDelete: true,
}

handler.meta = {
    version: '1',
    author: bot.displayName,
    note: 'idk..'
}

export default handler