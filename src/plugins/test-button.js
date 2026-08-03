import { InteractiveMessage } from "../helper/interactive-message.js"
import Stream from "node:stream"

const getCatStream = async () => {
    const r = await fetch(`https://cataas.com/cat?position=center`)
    return Stream.Readable.fromWeb(r.body)
}

/**
 * @import {PluginCtx, Plugin} from "../types/types.js"
 */

/**
 * main plugin function
 * @param {PluginCtx} ctx 
 * @returns {Promise <any>}
 */
async function run(ctx) {
    const { sock, jid, command } = ctx
   
    const im = new InteractiveMessage(sock)
    im.setTitle('cat')
        .setBody('kucing')
        .setFooter('kucing')
        .setTitle('furry')
        .setMedia({ image: { stream: await getCatStream() } })
        .addButtonQuickReply('lagi', command)
        .sendTo(jid)
}

/** @type {Plugin} */
const plugin = {
    run,
    name: "test button",
    commands: ["kucings"],
    categories: ["example"],
    description: "button code example with custom helper"
}

plugin.meta = {
    fileName: "test-button.js",
    version: "1",
    author: "wolep",
    note: "idk"
}

export default plugin