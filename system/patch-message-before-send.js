import { getContentType, normalizeMessageContent} from "baileys"

export default function (message) {
    message = normalizeMessageContent(message)
    const type = getContentType(message)
    const text =
        message[type]?.text || // teks + dll
        message[type]?.caption || // gambar dan video
        null

    if (text) {
        let lids = text.match(/@\d{13,15}/g) // gw teliti 100+ lids, length mereka antara 13-15 digit angka :v
        if (lids?.length) {
            lids = [...new Set(lids)]
            lids = lids.map(mention => mention.substring(1) + '@lid')
            message[type].contextInfo ??= {};
            message[type].contextInfo.mentionedJid = lids;
        }
    }
    return message
}