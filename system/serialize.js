
import { getContentType, normalizeMessageContent } from 'baileys'
import { store, bot } from './helper.js'

export default function (WAMessage) {
    //let m = structuredClone(mOri)

    // normalize message
    const WAMessageContent = normalizeMessageContent(WAMessage.message)

    // m.chatId
    const chatId = WAMessage.key.remoteJid
    // m.senderId
    const senderId = WAMessage.key.participant || (WAMessage.key.fromMe ? bot.lid : WAMessage.key.remoteJid)
    // m.pushName
    const pushName = WAMessage.pushName
    // m.type
    const type = getContentType(WAMessageContent)
    // m.text
    const text =
        // human
        WAMessageContent?.conversation || // text 
        WAMessageContent?.[type]?.text || // teks hyperlink, thumbnail dll
        WAMessageContent?.[type]?.caption || // gambar, video
        null

    // m.timestamp
    const timestamp = WAMessage.messageTimestamp

    // m.messageId
    const messageId = WAMessage.key.id

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
        get() { return WAMessage.key },
        enumerable: true
    })

    // mese <-> jadi define property
    Object.defineProperty(result, 'message', {
        get() { return WAMessageContent },
        enumerable: true
    })

    // m.q <-> jadi define property
    Object.defineProperty(result, 'q', {
        get() {
            const qctx = WAMessageContent?.[type]?.contextInfo
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
                chatId: WAMessage.key.remoteJid,
                senderId: q_senderId,
                pushName: q_pushName,
                type: q_type,
                text: q_text,
            }
            // m.q.key <-> jadi define property
            Object.defineProperty(q, 'key', {
                get() {
                    const q_key = {
                        remoteJid: q_iMessage ? WAMessage.key.remoteJid : null,
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