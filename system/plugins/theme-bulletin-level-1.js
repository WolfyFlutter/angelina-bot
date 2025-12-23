import { pluginManager, sendText, updateBulletin1, botInfo, userManager, textOnlyMessage } from '../helper.js'

/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {

    // return return
    if (!userManager.trustedJids.has(m.senderId)) return
    if (!textOnlyMessage(m)) return
    if (q) return

    if (!text?.trim()) return sendText(sock, jid, `mana param nya?`, m)

    if (text.trim() === 'get') {
        const pc = `${prefix||''}${command}`
        const bulletinForShare = pc + ' ' + botInfo.b1f + 'text' + botInfo.b1b
        await sendText(sock, jid, bulletinForShare)
        return
    }

    if (text.trim() === 'clear') {
        updateBulletin1('', '')
        pluginManager.buildMenu()
        await sendText(jid, `cleared! coba di test. ketik aja menu`)
        return
    }

    const match = text.match(/(.+?)(?:text|$)(.+?)?$/)
    let front = match?.[1] || ''
    const back = match?.[2] || ''
    updateBulletin1(front, back)
    pluginManager.buildMenu()
    await sendText(sock, jid, `sip, coba di test. ketik aja menu`)
    return
}

handler.pluginName = 'bulletin level 1'
handler.description = 'command buat atur bulletin level 1.\n' +
    'cara pakai\n' +
    '*b1 ᯓ★ text ★* buat set bulletin.\n' +
    '*b1 get* buat dapetin current bulletin.\n' +
    '*b1 clear* buat bersihin bulletin.'
handler.command = ['b1']
handler.category = ['theme']

handler.config = {
    systemPlugin: true,
    antiDelete: true,
}

handler.meta = {
    fileName: 'set-bulletin-level-1.js',
    version: '1',
    author: botInfo.an,
    note: 'furry itu seksi',
}

export default handler