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
        let result = await eval(`(async () => { ${text} })()`)
        if (typeof (result) !== 'string') result = util.inspect(result)
        return await sendText(sock, jid, result, mese)
    } catch (e) {
        console.log(e)
        return await sendText(sock, jid, e.message, mese)
    }
}

handler.pluginName = 'eval async'
handler.description = 'eval yang udah di bungkus oleh async function.. kalian bisa langsung pakai keyword await.. tapi inget return ya.. atau nanti hasil akan undefined'
handler.command = ['!!']
handler.category = ['misc']

handler.config = {
    systemPlugin: true,
    antiDelete: true,
    bypassPrefix: true,
}

handler.meta = {
    fileName: 'bot-eval-async.js',
    version: '1',
    author: botInfo.an,
    note: 'pal pale pale',
}

export default handler