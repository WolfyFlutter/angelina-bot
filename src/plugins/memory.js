import { formatByte, sendText, Category } from '../helper.js'

const formatMemory = (mem) => {
   const rss = `rss: ${formatByte(mem.rss)}\n`
   const ht = `heap total: ${formatByte(mem.heapTotal)}\n`
   const hu = `heap used: ${formatByte(mem.heapUsed)}\n`
   const e = `external: ${formatByte(mem.external)}\n`
   const ab = `array buffers: ${formatByte(mem.arrayBuffers)}`
   const print = rss + ht + hu + e + ab
   return print
}

async function handler({ m, text, jid, command }) {

   if (!text) {
      const mem = process.memoryUsage()
      const print = formatMemory(mem)
      return await sendText(jid, print, m)
   }
   else if (text === '-l') {
      process.send({ cmd: "memory" })
      process.once("message", async (msg) => {
         if (msg.cmd === "memory") {
            const mem = msg.data
            const print = formatMemory(mem)
            return await sendText(jid, print, m)
         }
      })
   } else {
      return await sendText(jid, "hmm invalid param. leave it empty to see bot's ram consume or use " + command + " `-h` to see ram consume by launcher.js")
   }
}

handler.pluginName = 'memory'
handler.command = ['memory']
handler.alias = ['mem']
handler.category = [Category.BOT]
handler.help = 'liat penggunaan memory node js. defaultnya return memory use by bot process. kalau isi param `-h` maka bakalan return memory use by launcher.js. pakai aja param `-h` buat flexing efisien ram consume ke orang biar mereka bengong haha...'

export default handler


