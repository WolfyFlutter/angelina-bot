/**
 * @import {WAMessage} from "baileys"
 * @import {ContactBase} from "../types/types.js"
 */

import { jidDecode } from "baileys"

/**
 * 
 * @param {WAMessage} wam 
 * @return {ContactBase|undefined}
 */
const chatSerialize = (wam) => {
    const decode = jidDecode(wam.key?.remoteJid)
    if (decode.server === "s.whatsapp.net") {
        return undefined
    } else {
        return {
            primaryId: wam.key.remoteJid
        }
    }

}

export { chatSerialize }