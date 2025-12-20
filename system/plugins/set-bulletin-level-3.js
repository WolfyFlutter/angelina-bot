import { pluginManager, sendText, botInfo, updateBulletin3, userManager, textOnlyMessage } from '../helper.js'

/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {

    // return return
    if (!userManager.trustedJids.has(m.senderId)) return
    if (!textOnlyMessage(m, q)) return

    if (!text?.trim()) return sendText(jid, `mana param nya?`, m)

    if (text.trim() === 'get') {
        const bulletinForShare = 'b2 ' + botInfo.b2f + 'text' + botInfo.b2b
        await sendText(jid, bulletinForShare)
        return
    }

    if (text.trim() === 'clear') {
        updateBulletin3('', '')
        pluginManager.buildMenu()
        await sendText(jid, `cleared! coba di test. ketik aja menu`)
        return
    }

    const match = text.match(/(.+?)(?:text|$)(.+?)?$/)
    let front = match?.[1] || ''
    const back = match?.[2] || ''
    updateBulletin3(front, back)
    pluginManager.buildMenu()
    await sendText(jid, `sip, coba di test. ketik aja menu`)
    return
}

handler.pluginName = 'bulletin level 3'
handler.description = 'command buat atur bulletin level 3.\n' +
    'cara pakai\n' +
    '*b1 ᯓ★ text ★* buat set new bulletin.\n' +
    '*b2 get* buat dapetin current bulletin.\n' +
    '*b2 clear* buat bersihin bulletin.'
handler.command = ['b3']
handler.category = ['set']

handler.config = {
    systemPlugin: true,
    bypassPrefix: true,
    antiDelete: true,
}

handler.meta = {
    fileName: 'set-bulletin-level-2.js',
    version: '1',
    author: botInfo.authorName,
    note: 'cia cia cia',
}

export default handler