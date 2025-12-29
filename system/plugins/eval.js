// external import
import * as b from 'baileys'

// local import
import { sendText, botInfo, userManager, store } from '../helper.js'
import * as wa from '../helper.js'

// node import
import fs from 'node:fs'
import crypto from 'node:crypto'
import util from 'node:util'


/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {

    const mese = q || m
    // return return hm
    if (!userManager.trustedJids.has(m.senderId)) return
    try {
        let result = await eval(`${text}`)
        if (typeof (result) !== 'string') result = util.inspect(result)
        return await sendText(sock, jid, result, mese)
    } catch (e) {
        console.log(e)
        return await sendText(sock, jid, e.message, mese)

    }
}

handler.pluginName = 'eval'
handler.description = 'eval biasa.. cuma kalau return nya promise otomatis di await. be careful'
handler.command = ['!']
handler.category = ['built-in']

handler.config = {
    systemPlugin: true,
    bypassPrefix: true,
}

handler.meta = {
    fileName: 'eval.js',
    version: '1',
    author: botInfo.an,
    note: 'debag debug',
}

export default handler