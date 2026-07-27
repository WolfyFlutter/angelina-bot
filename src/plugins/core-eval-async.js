/**
 * @import {PluginCtx, Plugin} from "../types/types.js"
 */

import util from 'node:util'
import crypto from 'node:crypto'
import fs from "node:fs"
import * as baileys from "baileys"
import * as commonHelper from "../helper/common.js"


/**
 * @param {PluginCtx} ctx 
 * @returns {Promise <any>}
 */

async function run(ctx) {
    const { sock, jid, m, q, text, } = ctx
    const WAM = q || m

    try {
        let result = await eval(`(async () => { ${text} })()`)
        if (typeof (result) !== 'string') result = util.inspect(result)
        return await sock.sendMessage(jid, { text: result }, { quoted: WAM })
    } catch (e) {
        console.log(e)
        return await sock.sendMessage(jid, { text: e.message }, { quoted: WAM })
    }
}

/**@type {Plugin} */
const plugin = {
    run,
    name: "eval async",
    commands: ["!!"],
    categories: ["core"],
    description: "eval yang udah di bungkus oleh async function, jadi bisa pakai keyword await. ingat return ya!"
}

plugin.meta = {
    fileName: "core-eval-async.js",
    author: "wolep",
    note: "baru belajar bikin base",
    version: "1"
}

plugin.config = {
    protected: true,
    bypassPrefix: true
}

export default plugin