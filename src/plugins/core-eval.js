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
 * @returns {Promise<any>}
 */
async function run(ctx) {
    const { sock, m, q, text, jid } = ctx
    const wam = q || m
    try {
        let result = await eval(`${text}`)
        if (typeof (result) !== 'string') result = util.inspect(result)
        return await wam.reply(result)
    } catch (e) {
        console.log(e)
        return await wam.reply(e.message)
    }
}

/**@type {Plugin} */
const plugin = { run, 
    name: 'eval',
    commands: ["!"],
    categories : ["core"],
    description: "eval biasa"
}

plugin.meta = {
    fileName: "core-eval.js",
    author: "wolep",
    note: "baru belajar bikin base",
    version: "1"
}

plugin.config = {
    protected: true,
    bypassPrefix: true
}

export default plugin