// external import
import * as b from 'baileys'

// local import
import { sendText, botInfo, userManager } from '../helper.js'
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
        let result = await eval(`(async () => { ${text} })()`)
        if (typeof (result) !== 'string') result = util.inspect(result)
        return await sendText(sock, jid, result, mese)
    } catch (e) {
        console.log(e)
        return await sendText(sock, jid, e.message, mese)
    }
}

handler.pluginName = 'eval async'
handler.description = 'eval yang udah di bungkus oleh async function. kalian bisa langsung pakai keyword await, tapi inget return ya. atau nanti hasil akan undefined karena di bungkus di dalam function.'
handler.command = ['!!']
handler.category = ['advanced']

handler.config = {
    systemPlugin: true,
    bypassPrefix: true,
}

handler.meta = {
    fileName: 'advanced-eval-async.js',
    version: '1',
    author: botInfo.an,
    note: 'pal pale pale',
}

export default handler