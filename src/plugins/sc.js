import { sendText, tag, Category, textOnlyMessage, downloadBuffer } from '../helper.js'
import fs from 'fs'

/**
 * @param {Object} params
 * @param {import("baileys").WASocket} params.sock   // ← auto-complete muncul di sini
 */

async function handler({ sock, jid, text, m, q, prefix, command }) {

    if (!textOnlyMessage) return
    return await sock.sendMessage(jid,
       
        {
            text : 'download sc sekarang',
            contextInfo: {
                externalAdReply : {
                    thumbnail : await fs.promises.readFile('./src/assets/angelina_thumbnail_480p.webp'),
                    thumbnailUrl: 'https://github.com/WolfyFlutter/angelina-bot',
                    title : 'sc bot wa angelina new',
                    body : 'download sc bot wa terbaru',
                    sourceUrl : 'https://github.com/WolfyFlutter/angelina-bot',
                    renderLargerThumbnail: true,
                    mediaType: 1,
                }
            }
        },{quoted : q}
    )
}

//handler.bypassPrefix = true

handler.pluginName = 'mendapatkan source code bot wa'
handler.command = ['sc']
handler.alias = []
handler.category = [Category.OTHER]
handler.help = 'taruh deskripsi kamu disini'

export default handler


