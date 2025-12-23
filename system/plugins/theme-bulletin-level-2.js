import { pluginManager, sendText, botInfo, updateBulletin2, userManager, textOnlyMessage } from '../helper.js'

/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {
    // return return
    if (!userManager.trustedJids.has(m.senderId)) return
    if (!textOnlyMessage(m)) return
    if(q) return

    if (!text?.trim()) return sendText(sock, jid, `mana param nya?`, m)

    if (text.trim() === 'get') {
        const pc = `${prefix||''}${command}`
        const bulletinForShare = pc + ' ' + botInfo.b2f + 'text' + botInfo.b2b
        await sendText(sock, jid, bulletinForShare)
        return
    }

    if (text.trim() === 'clear') {
        updateBulletin2('', '')
        pluginManager.buildMenu()
        await sendText(sock, jid, `cleared! coba di test. ketik aja menu`)
        return
    }

    const match = text.match(/(.+?)(?:text|$)(.+?)?$/)
    let front = match?.[1] || ''
    const back = match?.[2] || ''
    updateBulletin2(front, back)
    pluginManager.buildMenu()
    await sendText(sock, jid, `sip, coba di test. ketik aja menu`)
    return
}

handler.pluginName = 'bulletin level 2'
handler.description = 'command buat atur bulletin level 2.\n' +
    'cara pakai\n' +
    '*b2 ᯓ★ text ★* buat set new bulletin.\n' +
    '*b2 get* buat dapetin current bulletin.\n' +
    '*b2 clear* buat bersihin bulletin.'
handler.command = ['b2']
handler.category = ['theme']

handler.config = {
    systemPlugin: true,
    antiDelete: true,
}

handler.meta = {
    fileName: 'set-bulletin-level-2.js',
    version: '1',
    author: botInfo.an,
    note: 'cia cia cia',
}

export default handler