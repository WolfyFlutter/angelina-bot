import { longNormalizer } from "../helper/common.js"

/**
 * @import {WAMessage, WAMessageKey} from "baileys"
 */

/**
 * @typedef {object} memberLabelBase 
 * @property {WAMessageKey['remoteJid']} groupJid 
 * @property {WAMessageKey['participant']} authorLid 
 * @property {WAMessageKey['participantAlt']} authorPn
 * @property {string} [label] kalau user hapus label, maka akan isi undefined
 * @property {number} timestamp dalam satuan detik
 */

/**
 * fungsi yang mengambil param type WAMessage dan mereturn memberLabelBase
 * @param {WAMessage} WAM 
 * @returns {memberLabelBase} 
 */

const memberLabelSerialize = (WAM) => {

    const groupJid = WAM?.key?.remoteJid
    const authorLid = WAM?.key?.participant
    const authorPn = WAM?.key?.participantAlt
    const timestamp = longNormalizer(WAM?.message?.protocolMessage?.memberLabel?.labelTimestamp)
    const label = WAM?.message?.protocolMessage?.memberLabel?.label || undefined

    return {
        groupJid,
        authorLid,
        authorPn,
        timestamp,
        label
    }
}

export { memberLabelSerialize }