/**
 * @import {PluginCtx, Plugin} from "../types/types.js"
 */

import util from "node:util"
import { db } from "../database/database.js"
import { toJsObject } from "../helper/common.js"

/**
 * @param {PluginCtx} ctx 
 * @returns {Promise<any>}
 */
async function run(ctx) {
    const { m, text, q } = ctx
    const sqlQuery = text??''.trim()

    if (!sqlQuery) return await m.reply(`mana query sql nya bro?`)
    
    const wam = q || m

    try {
        const dbResult = db.prepare(sqlQuery).get()
        const result = util.inspect(toJsObject(dbResult)) 
        wam.reply(result)
    } catch (e) {
        wam.reply(`fail\n${e.message}`)
    }
}

/**@type {Plugin} */
const plugin = { run,
    name: "sql playground",
    commands: ["sql"],
    categories: ["core"],
    description: "type any sql query and get result. plugin masih beta, return nya pakai .get()",
 }

plugin.meta = {
    fileName: "core-sql-playground.js",
    author: "wolep",
    note: "hati hati lu jangan delete data sendiri :v",
    version: "1"
}

plugin.config = {
    protected: true,
    bypassPrefix: true
}

export default plugin