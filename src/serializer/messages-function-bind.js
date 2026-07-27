/**
 * @import {WASocket, WAMessage} from "baileys"
 */
import { downloadMediaMessage } from "baileys"

/**
 * 
 * @param {"buffer" | "stream"} dataType 
 * @returns 
 */
function download(dataType) {
    /** @type {WAMessage}*/
    const m = this
    return downloadMediaMessage(m, dataType)
}

function react(emoji) {
    /**@type {WASocket}  */
    const sock = this.sock

    /** @type {WAMessage}*/
    const m = this
    return sock.sendMessage(m.key.remoteJid, {
        react: {
            key: m.key,
            text: emoji
        }
    })
}

function reply(text) {
    /**@type {WASocket}  */
    const sock = this.sock

    /** @type {WAMessage}*/
    const m = this
    return sock.sendMessage(m.key.remoteJid, {
        text
    }, { quoted: m })
}


function del () {
    /**@type {WASocket}  */
    const sock = this.sock

    /** @type {WAMessage}*/
    const m = this
    return sock.sendMessage(m.key.remoteJid, {
        delete : m.key
    })
}

export { download, react, reply, del }