import { getContentType, normalizeMessageContent, proto} from 'baileys'


/**
 * @import {MessageContentBase} from "../types/types.js"
 * @param {import('baileys').WAMessage} wam
 * @returns {MessageContentBase}
 */

const contentSerialize = function (wam) {

    let content
    let type

    content = getContentType(wam?.message)
    if (!content && wam.messageStubType) {
        content = 'messageStubType'
        type = wam.messageStubType
    } else {
        type = wam?.message?.[content]?.type
    }

    return {
        content,
        type
    }
}

export { contentSerialize }