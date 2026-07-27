import { resizeImage } from "../helper/image-processing.js"

/**
 * @import {PluginCtx, Plugin} from "../types/types.js"
 */

/**
 * main plugin function
 * @param {PluginCtx} ctx 
 * @returns {Promise <any>}
 */
async function run(ctx) {
    const { m, sock, jid, q } = ctx
    if (q?.content !== "imageMessage") return await m.reply(`reply ke image message`)
    const inputStream = await q.download()
    const outputStream = resizeImage(inputStream, 48)
    return await sock.sendMessage(jid, {
        image: { stream: outputStream }
    })

}

/** @type {Plugin} */
const plugin = {
    run,
    name: "crop",
    commands: ["crop"],
    categories: ["dev"],
    description: "gak tau"
}

plugin.meta = {
    fileName: "crop.js",
    version: "1",
    author: "wolep",
    note: "idk"
}

export default plugin