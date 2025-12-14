
import { sendText, commandOnly, Category } from './../helper.js'

/**
 * @param {Object} params
 * @param {import("baileys").WASocket} params.sock   // ← auto-complete muncul di sini
 */


async function handler({ m, text, jid}) {
   if (commandOnly(m, text)) return await sendText(jid, 'pong', m)
}

handler.bypassPrefix = false
handler.pluginName = 'ping'
handler.command = ['ping']
handler.alias = ['p']
handler.category = [Category.BOT]
handler.help = 'buat test apakah bot respond apa kagak.'

export default handler