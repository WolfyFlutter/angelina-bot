import { Readable } from "node:stream"
import { normalizeMessageContent, getContentType, downloadMediaMessage, delay } from "baileys"

const Emoji = Object.freeze({
    WAIT: "✨",
    DONE: "✅",
    ERROR: "❌",
})

const DELAY_TIME = 1000 //ms

const ALLOWED_MIME = new Set([
    "text/javascript",
    "application/javascript"
])

/**
 * @import {PluginCtx, Plugin} from "../types/types.js"
 */

/** 
 * @typedef {object} ApiOptions
 * @property {"code"} [mode] TODO, tanya ke pemilik API
 * @property {string} [lang] Jenis bahasa pemrograman
 * @property {string} [title] Judul file yang akan muncul di atas
 */

/**
 * main api fungsi menerima 2 param, code dan options, dan mereturn stream
 * menggunakan native fetch node js
 * @param {string} code Kode program yang ingin dicetak.
 * @param {ApiOptions} [options]
 * @returns {Promise<import('node:stream').Readable>}
 * @throws {Error} Jika request gagal.
 */

const codeToImage = async (code, options = {}) => {
    if (!code) throw Error(`param kode gak boleh kosong`)
    const {
        lang = undefined, //default idk
        mode = 'code', // default code
        title = undefined // default idk
    } = options
    const headers = {
        "Content-Type": "application/json" // this should do the magic
    }
    const body = JSON.stringify({ code, lang, mode, title })
    const response = await fetch('https://api.azbry.com/api/maker/code2img', {
        body,
        headers,
        method: 'post'
    })
    if (!response.ok) throw Error(`${response.status} ${response.statusText}\n${await response.text()}`)
    return Readable.fromWeb(response.body)
}

/**
 * @param {PluginCtx} ctx 
 * @returns {Promise<any>}
 */
async function run(ctx) {
    const { m, q, sock, jid } = ctx

    try {
        if (!q) return await m.reply(`reply ke message`)

        let code = ''
        let fileName = ''

        /**
         * terkadang kita perlu melakukan normalize message
         * soalnya aku coba di web, path pesan dokumen
         * masuk lagi ke path documentWithCaptionMessage
         * jadi perlu di "unwrap" atau "normalize"
         */
        const quotedNormalizedMessage = normalizeMessageContent(q.message)
        const quotedContentType = getContentType(quotedNormalizedMessage)

        if (quotedContentType === "documentMessage") {
            // kita cek mimenya apakah ada di allowed list mime
            const documentMime = quotedNormalizedMessage?.documentMessage?.mimetype ?? ''
            if (!ALLOWED_MIME.has(documentMime)) {
                return await m.reply(`dokument message sih, tapi aku gak suka mime ${documentMime}`)
            }

            await m.react(Emoji.WAIT)
            code = await downloadMediaMessage({ message: quotedNormalizedMessage }, "buffer") + ""
            fileName = quotedNormalizedMessage?.documentMessage?.fileName ?? ''

            // api call
            const stream = await codeToImage(code, {
                mode: "code",
                title: fileName,
                lang: 'javascript'
            })

            await sock.sendMessage(jid, {
                image: { stream },
            }, { quoted: q })

            await delay(DELAY_TIME)
            return await m.react(Emoji.DONE)
        }
        else if (quotedContentType === "conversation" || quotedContentType === "extendedTextMessage") {
            code = q.text
            fileName = code.match(/fileName: ?"(.+?)"/)?.[1] ?? ''
            if (!code) return await m.reply(`gaada teks apapun hmm`)

            await m.react(Emoji.WAIT)

            // api call
            const stream = await codeToImage(code, {
                mode: 'code',
                title: fileName,
                lang: 'javascript'
            })

            await sock.sendMessage(jid, {
                image: { stream },
            }, { quoted: q })

            await delay(DELAY_TIME)
            return await m.react(Emoji.DONE)
        }
        else {
            return await m.reply(`pesan ${q.content} tidak di dukung`)
        }
    } catch (e) {
        await m.reply(`terjadi kesalahan\n${e.message}`)
        await m.react(ERROR_EMOJI)
    }
}

/**@type {Plugin} */
const plugin = { run }

plugin.name = "code to image"
plugin.commands = ["c2i"]
plugin.categories = ["other"]
plugin.description = "print your beautiful code into image! reply document text or text messages. this plugin using azbry api. visit the website https://api.azbry.com/docs now. there are many cool api there!"

plugin.meta = {
    fileName: "code-to-image.js",
    author: "wolep",
    note: "buat flexing code ygy, thanks to febry buat awesome api nya",
    version: "1",
    url: 'https://api.azbry.com/docs'
}

plugin.config = {
    removeFirstUrl: true
}

export default plugin