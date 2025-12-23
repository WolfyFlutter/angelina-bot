import { sendText, botInfo, userManager } from '../helper.js'
import * as wa from '../helper.js'

import fs from 'node:fs'
import crypto from 'node:crypto'
import util from 'node:util'

import * as b from 'baileys'

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
handler.category = ['misc']

handler.config = {
    systemPlugin: true,
    antiDelete: true,
    bypassPrefix: true,
}

handler.meta = {
    fileName: 'bot-eval.js',
    version: '1',
    author: botInfo.an,
    note: 'debag debug',
}

export default handler