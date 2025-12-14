import { user, bot, sock, store } from '../../../index.js'
import * as wa from '../../helper.js'
import { sendText, textOnlyMessage, Category } from '../../helper.js'
import fs from 'fs'
import crypto from 'crypto'
import util from 'node:util'
import * as b from 'baileys'

async function handler({ sock, jid, text, m, q, prefix, command }) {

    if (!user.trustedJids.has(m.senderId)) return
    if (!textOnlyMessage(m)) return

    try {
        let result = await eval(`${text}`)
        if (typeof (result) !== 'string') result = util.inspect(result)
        return await sendText(jid, result, m)
    } catch (e) {
        console.log(e)
        return await sendText(jid, e.message, m)

    }
}

handler.preventDelete = true
handler.bypassPrefix = true
handler.pluginName = 'eval'
handler.command = ['!']
handler.alias = []
handler.category = [Category.OWNER]
handler.help = 'Eval biasa kayak browser'

export default handler


