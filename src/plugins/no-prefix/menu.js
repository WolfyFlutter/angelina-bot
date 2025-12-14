import { menuText, categoryText, category } from '../../plugin-handler.js'
import { sendText, tag, textOnlyMessage, sendFancyText, msToReadableTime, pickRandom } from '../../helper.js'
import { prefixManager } from '../../../index.js'

const getUptime = function () {
    return new Promise((resolve, reject) => {
        process.send({ cmd: "runtime" })
        process.once("message", async (msg) => {
            if (msg.cmd === "runtime") {
                resolve(msg.data)
            }
        })
    })
}


async function handler({ sock, m, text, q, jid, prefix, command }) {

    const imgUrl = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj8Jf0AJ4g-4_jHICkPf_9EpaUHjZowQnx-WNJBPgJbuAJoZf0S8prMdhsF4EiB5PeVZ52o2y7oiTMN7NVuAkkMQzVMXKBzGt1-5eGb2oWyW4sKrVHZBrzVMd-CMdHszvH9QRCDhoeQe5qqD2AJVMQUEmISh2VjAphGLpXvoaEsOmjZT7hv7zlwIgoLTXc/s16000/angelina_thumbnail_480p.webp'
    if (!textOnlyMessage(m)) return
    if (q) return

    if (!text) {
        const p = prefixManager.getInfo().isEnable ? prefixManager.getInfo().prefixList[0] : ''
        const headers = `halo kak ${tag(m.senderId)}\nberikut daftar menu yang tersedia:\n\n`
        const footer = `gunakan perintah ${p}${command} <categori> untuk membuka sub menu`
        const uptime = msToReadableTime(Math.floor(process.uptime()) * 1000)
        return await sendFancyText(jid, headers + categoryText + '\n\n' + footer, "angelina bot 🌻", "runtime " + uptime + "", imgUrl, true)
    } else {
        const commandList = category.get(text)
        if (!commandList.length) return await sendFancyText(jid, 'aduh menu nya kosong bro..', 'menu ' + text, 'angelina bot 🌻', null, false)
        if (!commandList) return await sendText(jid, `invalid category`, m)
        const header = 'command tersedia\n\n'
        const print = commandList.map(c => ` » ${c}`).join("\n")
        const footer = '\n\ngunakan perintah *-h* jika kamu ingin tau fungsi command. contoh *' + (commandList[0].split(/ +/g)?.[0].replace(/,$/g, '') || '(empty plugin)') + ' -h*'
        return await sendFancyText(jid, header + print + footer, 'menu ' + text, 'angelina bot 🌻', null, false)
    }

}

handler.preventDelete = true
handler.bypassPrefix = false
handler.pluginName = 'menu'
handler.command = ['menu']
handler.alias = []
handler.category = []
handler.help = 'tampilkan menu'

export default handler


