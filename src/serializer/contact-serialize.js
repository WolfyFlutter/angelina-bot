/**@import {WASocket, WAMessage} from "baileys" */

/**@import {ContactBase} from "../types/types.js" */

import { isLidUser, jidDecode, jidNormalizedUser } from "baileys"
import { longNormalizer } from "../helper/common.js"

/**
 * fungsi ini mengubah WAMessage menjadi contactSerialize yang nantinya masuk ke fungsi upsertAndGet di objek contactStore
 * dari fungsi upsertAndGet, di return type contactCache yang lebih lengkap dan masuklah ke m.contact, gitu ges kira kira
 * @param {WAMessage} WAM wa message
 * @param {WASocket} sock
 * @returns {ContactBase|undefined} kadang gw return undefined kalau kenapa kenapa, jadi gak selalu sukses ya, lu bikin if buat handle nya
 */

const contactSerialize = (WAM, sock) => {
    const { key, verifiedBizName, pushName } = WAM

    let primaryId
    let secondaryId
    let name = pushName || verifiedBizName
    let updatedAt = longNormalizer(WAM?.messageTimestamp)

    const removeJidServer = jidDecode(key.remoteJid).server

    // gc
    if (removeJidServer === "g.us") {
        if (key.addressingMode === "lid") {
            primaryId = key?.participant
            secondaryId = key?.participantAlt
        }

        // pernah jir kosong addresingMode nya, pas pesan append, lalu messageStubType nya 32
        // jadi kita cek participant nya, biasanya lid, karena kita udh punya data lengkap
        // resolve aja primary nya tapi tetep cek lid dulu
        else {
            if (isLidUser(key?.participant)) {
                primaryId = key?.participant
            }
        }
    }

    // private chat, self chat
    else if (removeJidServer === "lid") {
        if (key.addressingMode === "lid") {
            primaryId = key?.remoteJid
            secondaryId = key?.remoteJidAlt

            // if dibawah jika pesan di kirim dari nomor bot (pakai akun wa)
            if (key?.fromMe) {
                primaryId = jidNormalizedUser(sock?.user?.lid)
                secondaryId = jidNormalizedUser(sock?.user?.id)

                // set ulang pushName
                name = sock?.user?.name
            }
        }
    }

    // status broadcast
    else if (removeJidServer === "broadcast") {
        if (key.addressingMode === "lid") {
            primaryId = key?.participant
            secondaryId = key?.remoteJidAlt
        }
    }

    else if (removeJidServer === "s.whatsapp.net") {
        if (key.remoteJid === "0@s.whatsapp.net") {
            primaryId = "0@s.whatsapp.net"
        } else {
            return undefined
        }

    }

    // add more serialize
    else {
        primaryId = key?.remoteJid
    }

    if (!primaryId) {
        if (WAM?.key?.fromMe) primaryId = jidNormalizedUser(sock.user.lid)
    }

    if(!primaryId){
        primaryId = WAM?.participant
    }

    return {
        primaryId,
        secondaryId,
        name,
        updatedAt
    }
}

export { contactSerialize }