import { botInfo, userManager, bot } from '../helper.js'

/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {

    if (!userManager.trustedJids.has(m.senderId)) return
    if (m.type !== "reactionMessage") return
    const qmk = m.message.reactionMessage.key // qmk = quoted message key
    const botMessage = qmk.participant === bot.lid || qmk.remoteJid === m.senderId || qmk.fromMe
    if (!botMessage) return

    const key = { ...qmk }
    key.fromMe = true
    return await sock.sendMessage(jid, { delete: key })
}

handler.pluginName = 'react delete'
handler.description = 'buat hapus pesan by react'
handler.command = ['❌']
handler.category = ['built-in']

handler.config = {
    bypassPrefix: true,
    systemPlugin: true,
}

handler.meta = {
    fileName: 'react-delete.js',
    version: '1',
    author: botInfo.an,
    note: 'hapus aib',
}

export default handler