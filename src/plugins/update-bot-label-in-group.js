
import { user } from '../../index.js'
import { sendText, Category, setBotLabel, textOnlyMessage } from '../helper.js'
import { isJidGroup } from 'baileys'

async function handler({ m, text, jid }) {
   // memastikan hanya owner bot saja yang bisa pakai fitur ini
   if(!user.trustedJids.has(m.senderId)) return await sendText(jid, 'only owner', m)

   // memastikan pesan hanya teks (conversation/extendedTextMessage)
   if (!textOnlyMessage(m)) return

   // memastikan pesan hanya berasal dari chat group
   if (!isJidGroup(jid)) return await sendText(jid, 'fitur ini hanya bisa digunakan di group', m)
   
   // memastikan teks ada
   if(!text) return sendText(jid, 'mana namanya wok?', m)

   // memastikan teks tidak lebih dari 30 karaker
   if (text.length > 30) return await sendText(jid, 'panjang teks maksimal 30 karakter!', m)

   // atur label
   await setBotLabel(jid, text)

   // kirim pesan kembali
   return await sendText(jid, 'sukses! check my new label boss')
}

handler.pluginName = 'change label bot'
handler.command = ['label']
handler.alias = []
handler.category = [Category.OWNER]
handler.help = 'mengubah label bot pada group. gunakan huruf dan angka saja. maksimal 30 karakter.'

export default handler