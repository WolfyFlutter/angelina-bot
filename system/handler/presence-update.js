
/**
 * @param {import ('baileys').WASocket} sock
 * @param {import('baileys').BaileysEventMap['presence.update']} bem
 */

import { sendText, tag, msToReadableTime } from '../helper.js'

export default async function presenceUpdate(sock, bem) {
    const { id, presences } = bem
    const userLid = Object.keys(presences||{})?.[0]
    const afk = global?.afk?.[userLid]
    console.log(afk)
    if(afk){
        delete global.afk[userLid]
        await sendText(sock, id, `${tag(userLid)} kembali dari ${afk.reason} selama ${msToReadableTime(Date.now() - afk.time)}`)
    }
}