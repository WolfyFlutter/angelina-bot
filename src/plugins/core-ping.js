/**
 * @import {PluginCtx, Plugin} from "../types/types.js"
 */

/**
 * main plugin function
 * @param {PluginCtx} ctx 
 * @returns {Promise <any>}
 */
async function run(ctx) {
    const { m } = ctx
    const name = m.contact.name || 'kamu'
    return await m.reply('wuff! hai ' + name)
}

/** @type {Plugin} */
const plugin = {
    run,
    name: "ping",
    commands: ["ping"],
    categories: ["core"],
    description: "cek bot apakah ok atau gak ok"
}

plugin.meta = {
    fileName: "core-ping.js",
    version: "1",
    author: "wolep",
    note: "idk"
}

plugin.config = {
    protected: true,
    bypassPrefix: true
}

export default plugin