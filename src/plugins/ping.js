import { sendText, commandOnly, Category } from './../helper.js'

async function handler({ m, text, jid}) {
   if (commandOnly(m, text)) return await sendText(jid, 'solid', m)
}

handler.pluginName = 'ping'
handler.command = ['ping']
handler.alias = []
handler.category = [Category.BOT]
handler.help = 'buat test apakah bot respond apa kagak.'

export default handler