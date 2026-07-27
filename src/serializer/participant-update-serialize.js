import { longNormalizer } from "../helper/common.js"

/**@import {WAMessageKey, WAMessage, ParticipantAction} from "baileys" */

/**
 * @typedef partcipantUpdateBase
 * @property {WAMessageKey['remoteJid']} groupJid
 * @property {WAMessage['participant']} [authorLid] return undefined jika participant join gc menggunakan url publik
 * @property {ParticipantAction} authorAction
 * @property {number} timestamp
 * @property {string} targetLid
 * @property {string} [targetPn]
 * @property {string} [admin] selalu undefined biasanya
 */

/**
 * fungsi yang mengserialize WAMessage menjadi participantUpdateBase
 * @param {WAMessage} WAM 
 * @param {ParticipantAction} participantAction
 * @returns {partcipantUpdateBase}
 */

const participantUpdateSerialize = (WAM, participantAction) => {
    for (const msp of WAM.messageStubParameters) {
        const groupJid = WAM.key?.remoteJid || undefined
        const authorLid = WAM?.participant || undefined
        const authorAction = participantAction
        const timestamp = longNormalizer(WAM.messageTimestamp)

        const json = JSON.parse(msp)
        const targetLid = json?.id || undefined
        const targetPn = json?.phoneNumber || undefined
        const admin = json?.admin || undefined

        const payload = {
            groupJid,
            authorAction,
            authorLid,
            targetLid,
            targetPn,
            timestamp,
            admin
        }
        return payload
    }
}


export { participantUpdateSerialize }