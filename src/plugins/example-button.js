import { InteractiveMessage } from "../helper/interactive-message.js"
const imageUrl = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj8Jf0AJ4g-4_jHICkPf_9EpaUHjZowQnx-WNJBPgJbuAJoZf0S8prMdhsF4EiB5PeVZ52o2y7oiTMN7NVuAkkMQzVMXKBzGt1-5eGb2oWyW4sKrVHZBrzVMd-CMdHszvH9QRCDhoeQe5qqD2AJVMQUEmISh2VjAphGLpXvoaEsOmjZT7hv7zlwIgoLTXc/s854/angelina_thumbnail_480p.webp'
const website = 'https://github.com/WolfyFlutter/angelina-bot'

/**
 * @import {PluginCtx, Plugin} from "../types/types.js"
 */

/**
 * @param {PluginCtx} ctx 
 * @returns {Promise <any>}
 */

async function run(ctx) {
    const { sock, jid, command } = ctx
    const im = new InteractiveMessage(sock)

    // set
    im.setTitle('button example')
        .setBody('easy create button, override icon')
        .setFooter('by wolep')

        // media
        .setMedia({
            image: { url: imageUrl }
        })

        // button
        .addButtonUrl('open url', website, {
            webview_interaction: true,
            icon: "PROMOTION"
        })
        .addButtonUrl('open url (external browser)', website, {
            icon: "PROMOTION"
        })
        .addButtonCopy('copy clipboard', 'iam gay', {
            icon: "PROMOTION"
        })
        .addButtonQuickReply('quick reply', 'menu', {
            icon: 'PROMOTION'
        })
        .addButtonSingleSelect(`single select`, [
            {
                title: `basic command`,
                highlight_label: 'top command',
                rows: [
                    {
                        title: 'core',
                        description: 'tampilkan menu core ',
                        id: 'menu core'
                    }, {
                        title: 'all',
                        description: 'tampilkan semua menu',
                        id: 'menu all'
                    },
                ]
            }, {
                title: `command lainnya`,
                highlight_label: `hot`,
                rows: [
                    {
                        title: 'waifu',
                        description: 'tampilkan random pap waifu',
                        id: 'waifu'
                    }, {
                        title: 'tampilkan hello world',
                        description: 'eval execute',
                        id: '! "hello world"'
                    }, {
                        title: 'plugin example button',
                        description: 'kirim plugin example button',
                        id: 'plugin get ' + command
                    }
                ]
            }
        ], { icon: "PROMOTION" })

        //little customize
        .setButtonLimit(1, {
            buttonTitle: 'option',
            listTitle: 'list',
            dividerIndicies: "all",
        })

        .sendTo(jid)
}

/** @type {Plugin} */
const plugin = {
    run,
    name: "example button",
    commands: ["exbtn"],
    categories: ["example"],
    description: "contoh kode button menggunakan class dan objek button"
}

plugin.meta = {
    fileName: "example-button.js",
    version: "1",
    author: "wolep",
    note: "idk"
}

export default plugin