import { sock, bot, user } from '../../../index.js'

async function handler({ m, jid}) {

    if (!user.trustedJids.has(m.senderId)) return
    if (m.type !== "reactionMessage") return
    const qmk = m.message.reactionMessage.key // qmk = quoted message key
    const botMessage = qmk.participant === bot.lid || qmk.remoteJid === m.senderId
    if (!botMessage) return

    console.log("hapus")
    const key = { ...qmk }
    key.fromMe = true
    return await sock.sendMessage(jid, { delete: key })
}

handler.preventDelete = true
handler.bypassPrefix = true
handler.pluginName = 'delete bot message'
handler.command = ['❌', '🚮', '🗑️', '🗑']
handler.alias = []
handler.category = []
handler.help = 'taruh deskripsi kamu disini'

export default handler


