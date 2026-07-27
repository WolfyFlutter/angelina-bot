import { InteractiveMessage } from "../helper/interactive-message.js"

/**
 * @import {PluginCtx, Plugin} from "../types/types.js"
 */

/**
 * main plugin function
 * @param {PluginCtx} ctx 
 * @returns {Promise <any>}
 */
async function run(ctx) {
    const { sock, jid } = ctx

    /* minimal code
        const im = new InteractiveMessage(sock)
        im.sendTo(jid)
    */

    // button use example
    const im = new InteractiveMessage(sock)

    // set
    im.setTitle('judul')
    .setBody('body')
    .setFooter('footer')

    // set media only support image, video and docment
    .setMedia({
        document: Buffer.from("hello world"),
        mimetype: 'plain/text',
        fileName: 'hello-world.txt'
    })

    // send
    im.sendTo(jid)    
}

/** @type {Plugin} */
const plugin = {
    run,
    name: "test button",
    commands: ["b"],
    categories: ["dev"],
    description: "button test"
}

plugin.meta = {
    fileName: "test-button.js",
    version: "1",
    author: "wolep",
    note: "idk"
}

export default plugin