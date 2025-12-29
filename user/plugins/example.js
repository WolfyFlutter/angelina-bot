import { tag, sendText, textOnlyMessage } from '#helper'

/**
 * @param {import('../../system/types/plugin').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {
    if (!textOnlyMessage(m)) return
    if (q) return

    const header = `hai!\n`
    const pushName = `ini pushname kamu: ${m.pushName}\n`
    const id = `ini id kamu (biasanya lid): ${m.senderId}\n`
    const tagUser = `dan ini tag kamu (tag otomatis msg patch) ${tag(m.senderId)}\n`
    const teksmu = `dan ini teks mu: ${text || `(kebetulan kamu gak ngirim teks tambahan jadi gak ada)`}\n`
    const prefixmu = `ini prefix mu: ${prefix || `(gak makek prefix alias null)`}\n`
    const commandmu = `dan ini command mu: ${command}`
    const print = header + pushName + id + tagUser + teksmu + prefixmu + commandmu
    return await sendText(sock, jid, print, m)
}

handler.pluginName = 'contoh 1'
handler.description = 'example'
handler.command = ['eg']
handler.category = ['example']

handler.meta = {
    fileName: 'example.js',
    version: '1',
    author: 'wolep',
    note: 'plugin example note',
}
export default handler