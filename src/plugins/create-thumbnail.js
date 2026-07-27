import { createThumbnailLink } from "../helper/thumbnail-link.js"

/**
 * @import {PluginCtx, Plugin} from "../types/types.js"
 */

/**
 * main plugin function
 * @param {PluginCtx} ctx 
 * @returns {Promise <any>}
 */
async function run(ctx) {
    const { m, text, sock, jid } = ctx
    const url = new URL(text)

    const wamc = await createThumbnailLink(sock, {
        image: { url }
    })

    return await sock.relayMessage(jid, wamc, {})

}

/** @type {Plugin} */
const plugin = {
    run,
    name: "create thumbnail",
    commands: ["ct"],
    categories: ["dev"],
    description: "gatau :v"
}

plugin.meta = {
    fileName: "create-thumbnail.js",
    version: "1",
    author: "wolep",
    note: "idk"
}

export default plugin