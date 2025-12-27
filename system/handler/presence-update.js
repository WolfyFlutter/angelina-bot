
/**
 * @param {import ('baileys').WASocket} sock
 * @param {import('baileys').BaileysEventMap['presence.update']} bem
 */

import { sendText, tag, msToReadableTime } from '../helper.js'

export default async function presenceUpdate(sock, bem) {
    const { id, presences } = bem
    const userLid = Object.keys(presences || {})?.[0]
    const afk = global?.afk?.[id]?.[userLid]
    //console.log(afk)
    if (afk) {
        const now = Date.now()
        const content = afk.IMessage.map(m => `✉️ dari: ${tag(m.senderId)} - ${msToReadableTime(now - (m.timestamp * 1000))} yang lalu. \n${m.text}`).join('\n\n')
        const header1 = `${tag(userLid)} kembali dari ${afk.reason} selama ${msToReadableTime(now - afk.time)}`
        const header2 = `welcome back ${tag(userLid)} udah selesai ${afk.reason}nya? selama kamu pergi.. ada yang tag kamu.`
        const print = content ? `${header2}\n\n${content}` : `${header1}`
        delete global.afk[id]
        await sendText(sock, id, print)
    }
}