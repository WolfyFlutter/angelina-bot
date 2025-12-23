
import { getContentType, normalizeMessageContent } from 'baileys'
import { store, bot } from './helper.js'

export default function (webMessagInfo) {
    //let m = structuredClone(mOri)

    // normalize message
    const iMessage = normalizeMessageContent(webMessagInfo.message)

    // m.chatId
    const chatId = webMessagInfo.key.remoteJid
    // m.senderId
    const senderId = webMessagInfo.key.participant || (webMessagInfo.key.fromMe ? bot.lid : webMessagInfo.key.remoteJid)
    // m.pushName
    const pushName = webMessagInfo.pushName
    // m.type
    const type = getContentType(iMessage)
    // m.text
    const text =
        // human
        iMessage?.conversation || // text 
        iMessage?.[type]?.text || // teks hyperlink, thumbnail dll
        iMessage?.[type]?.caption || // gambar, video
        null

    // m.timestamp
    const timestamp = webMessagInfo.messageTimestamp

    // m.messageId
    const messageId = webMessagInfo.key.id

    const result = {
        chatId,
        senderId,
        pushName,
        type,
        text,
        messageId,
        timestamp
    }

    // m.key <-> jadi define property
    Object.defineProperty(result, 'key', {
        get() { return webMessagInfo.key },
        enumerable: true
    })

    // mese <-> jadi define property
    Object.defineProperty(result, 'message', {
        get() { return iMessage },
        enumerable: true
    })

    // m.q <-> jadi define property
    Object.defineProperty(result, 'q', {
        get() {
            const qctx = iMessage?.[type]?.contextInfo
            const q_iMessage = normalizeMessageContent(qctx?.quotedMessage)
            if (!q_iMessage) return undefined

            let q = {}
            // m.q.type
            const q_type = getContentType(q_iMessage)
            // m.q.text
            const q_text =
                // human
                q_iMessage?.conversation ||  // text
                q_iMessage?.[q_type]?.text ||  // text, thumbnail, url dll
                q_iMessage?.[q_type]?.caption || // gambar, video
                // bot
                q_iMessage?.[q_type]?.body?.text || // interactiveMessage
                null

            // m.q.sender
            let q_senderId = qctx.participant.endsWith('@s.whatsapp.net') ? senderId : qctx.participant
            // m.q.pushName
            const q_pushName = store.contacts.get(q_senderId)?.notify || null
            q = {
                chatId: webMessagInfo.key.remoteJid,
                senderId: q_senderId,
                pushName: q_pushName,
                type: q_type,
                text: q_text,
            }
            // m.q.key <-> jadi define property
            Object.defineProperty(q, 'key', {
                get() {
                    const q_key = {
                        remoteJid: q_iMessage ? webMessagInfo.key.remoteJid : null,
                        id: qctx?.stanzaId || null,
                        participant: qctx?.participant || null,
                        fromMe: bot.lid === qctx?.participant || bot.pn === qctx?.participant
                    }
                    return q_key
                },
                enumerable: true
            })
            // m.q.message <-> jadi define property
            Object.defineProperty(q, 'message', {
                get() { return q_iMessage },
                enumerable: true
            })

            return q
        },
        enumerable: true
    })

    return result
}