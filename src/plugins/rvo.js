import { sendText, tag, Category, textOnlyMessage } from '../helper.js'
import { user } from '../../index.js'

async function handler({ sock, jid, m, q, command }) {

    if (!user.trustedJids.has(m.senderId)) return await sendText(jid, 'only owner', m)
    if (!textOnlyMessage(m)) return
    if (!q) return sendText(jid, 'reply command ' + command + ' ke pesan sekali lihat', m)
    const legitRvo = q.message[q.type].viewOnce
    if (!legitRvo) return sendText(jid, `hmm.. bukan pesan sekali liat ini mah ${tag(m.senderId)}`, q)
    q.message[q.type].viewOnce = false
    return sock.sendMessage(jid, { forward: q, contextInfo: { isForwarded: false } }, { quoted: q })
}

handler.pluginName = 'read view once'
handler.command = ['rvo']
handler.alias = []
handler.category = [Category.OWNER]
handler.help = 'melihat pesan view once'

export default handler