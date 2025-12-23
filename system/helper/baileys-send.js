import { vString } from './general-helper.js'


export async function sendText(sock, jid, text, replyTo) {
    vString(jid, "param jid")
    vString(text, "param text")
    return await sock.sendMessage(jid, { text }, { quoted: replyTo })
}

export async function editText(sock, jid, m, text) {
    vString(jid, "param jid")
    vString(jid, "param text")
    return await sock.sendMessage(jid, {
        text,
        edit: m.key
    })
}

// thumbnail
export async function sendFancyText(sock, jid, opts = {thumbnailUrlOrBuffer, renderLargerThumbnail, title, body, text, replyTo}) {
    vString(jid, "param jid")

    const {
        thumbnailUrlOrBuffer = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj8Jf0AJ4g-4_jHICkPf_9EpaUHjZowQnx-WNJBPgJbuAJoZf0S8prMdhsF4EiB5PeVZ52o2y7oiTMN7NVuAkkMQzVMXKBzGt1-5eGb2oWyW4sKrVHZBrzVMd-CMdHszvH9QRCDhoeQe5qqD2AJVMQUEmISh2VjAphGLpXvoaEsOmjZT7hv7zlwIgoLTXc/s16000/angelina_thumbnail_480p.webp',
        renderLargerThumbnail = true,
        title = 'title',
        body = 'subtitle',
        text = 'message',
    } = opts


    // resolve (thumbnail)

    let thumbnailContent = {}
    if (Buffer.isBuffer(thumbnailUrlOrBuffer)) {
        thumbnailContent = { thumbnail: thumbnailUrlOrBuffer }
    } else {
        const url = thumbnailUrlOrBuffer || value.thumbnailUrl
        thumbnailContent = { thumbnailUrl: url }
    }

    let externalAdReply = {
        title,
        body,
        mediaType: 1,
        renderLargerThumbnail,
    }

    externalAdReply = Object.assign(externalAdReply, thumbnailContent)

    return await sock.sendMessage(jid, {
        text: text,
        contextInfo: { externalAdReply }
    }, { quoted: opts?.replyTo })
}