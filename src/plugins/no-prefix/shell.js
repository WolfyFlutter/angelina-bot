import { user } from '../../../index.js'
import { sendText, textOnlyMessage, Category } from '../../helper.js'
import { exec } from 'child_process'
import util from 'util'
const execPromise = util.promisify(exec)

async function handler({ sock, m, text, jid, prefix, command }) {

   if (!user.trustedJids.has(m.senderId)) return
   if (!textOnlyMessage(m)) return

   if (!text) return await sendText(jid, 'mana command shell nya?')
   try {

      const { stdout, stderr } = await execPromise(text)
      let output = stdout || stderr || '✅ Tidak ada output.'
      if (output.length > 1000) output = output.slice(0, 2000) + '\n\n[Output terpotong...]'

      await sendText(jid, output.trim(), m)
   } catch (e) {
      await sendText(jid, `❌ Error:\n${e.message}`, m)
   }
}

handler.preventDelete = true
handler.bypassPrefix = true
handler.pluginName = 'terminal'
handler.command = ['$']
handler.alias = []
handler.category = [Category.OWNER]
handler.help = 'malas bikin desc :v'

export default handler