//MODIFIED

/**
 * @import {PluginCtx, Plugin, ContactCache} "../types/types.js"
 */

import { jidDecode } from "baileys"
import { Stream } from "node:stream"

/**
 * @returns {string} format kaya jam 13.10
 */
const getNowTime = () => {
    return Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Makassar"
    }).format(Date.now())
}

/**
 * 
 * @param {PluginCtx} ctx 
 * @returns 
 */
async function run(ctx) {
    const { m, q, contactStore, sock, jid } = ctx

    if (!q) return await m.reply('reply ke pesan orang')

    const senderName = "~ " + (q?.contact?.name || 'anonim')
    const senderNumber = jidDecode(q?.contact?.secondaryId)?.user || ''

    const mentionedJids = q?.message?.[q?.content]?.contextInfo?.mentionedJid || []

    /**@type {ContactCache[]} */
    const mentionedContacts = mentionedJids.map(lid => contactStore.upsertAndGetContact({
        primaryId: lid
    }))
    const mentionedPushNames = mentionedContacts.map(contact => {
        const mention = "@" + jidDecode(contact?.primaryId)?.user
        const name = contact?.name || 'anonim'
        return { mention, name }
    })

    let parsedText = q?.text
    mentionedPushNames.forEach(v => {
        parsedText = parsedText.replaceAll(v.mention, "[@" + v.name + "]")
    })


    try {

        let imageb64 = ""
        let hasImage = false
        // if imageMessage, try to download the image first

        if (q.content === "imageMessage" || q.content === "extendedTextMessage") {
            try {
                const imageBuffer = await q.download("buffer")
                imageb64 = imageBuffer.toString("base64")
                hasImage = true
                if (q.content === "extendedTextMessage") {
                    const title = `*${(q.message?.extendedTextMessage?.title ?? '').trim()}*`
                    const description = `> ${(q.message?.extendedTextMessage?.description ?? '').trim()}`
                    const text = (q.text.replace(q.message?.extendedTextMessage?.matchedText,'') ?? '').trim()
                    parsedText = `${title}\n${description}\n\n${text}`.trim()
                }
            } catch (_) {
                // shhhh
            }
        }

        if (!hasImage && !parsedText) return await m.reply(`reply ke pesan yang isi teks atau gambar`)

        // api call
        const res = await fetch('https://qwa.eeq.my.id/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "sender_name": senderName,
                "sender_number": senderNumber,
                "sender_avatar": "",
                "sender_image": imageb64,
                "message": parsedText,
                "time": getNowTime(),
                "background": true
            })
        });

        // response cek
        if (!res.ok) throw Error(`${res.status} ${res.statusText}\n` + await res.text())

        // transform web stream into node stream
        const stream = Stream.Readable.fromWeb(res.body)

        // send to chat
        return await sock.sendMessage(jid, {
            image: { stream }
        }, {
            quoted: m
        })
    } catch (e) {
        return await m.reply(`❌ gagal menghubungi api\n` + e.message)
    }
}

/**@type {Plugin} */
const plugin = { run }

plugin.name = "quoted wa"
plugin.commands = ["qwa"]
plugin.categories = ["other"]
plugin.description = "bikin quoted chat wa realistic. cukup reply ke message dan ketik qwa. more about the api https://qwa.eeq.my.id"

plugin.meta = {
    fileName: "quoted-wa.js",
    author: "wolep",
    note: "makasih buat ghofar selaku owner api, visit aja web nya bagus.",
    version: "1",
    url: "https://qwa.eeq.my.id"
}

plugin.config = {
    removeFirstUrl: true,
}

export default plugin