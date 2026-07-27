import { getFirstStringAndRest } from "../helper/common.js"
import { createThumbnailLink } from "../helper/thumbnail-link.js"
import { resizeImage } from "../helper/image-processing.js"
import { prepareWAMessageMedia, proto, normalizeMessageContent, getContentType, downloadMediaMessage, downloadContentFromMessage } from "baileys"
import { Readable } from "node:stream"

const Emoji = Object.freeze({
    SUCCESS: '✅'
})

const String = Object.freeze({
    INVALID_SUBCOMMAND: `invalid subcommand`,
    TEXT_REQUIRE: `masukkan teks`,
    NO_SUBCOMMAND_1: `opsi tersedia:
- title
- description
- url
- thumbnail 
- export
- use
- preview (wip)`,
    SGC: `opsi tersedia
- set <text>
- get
- clear`,
    SG: `opsi tersedia
- set <text>
- get`,
    URL: `opsi tersedia
- set <urls>
- get`,
    THUMB: `opsi tersedia
- set <url>
- set (reply ke image / thumbnail)
- get`
})

const checkUrl = (url) => { try { return new URL(url)?.toString() } catch (e) { return undefined } }
const sanitizeFileName = s => s?.replaceAll(/[-\.//\\]+/g, '')?.match(/\S+/g)?.join('-')

/**
 * @import {PluginCtx, Plugin} from "../types/types.js"
 * @typedef {"title" | "description" | "desc" | "thumbnail" | "thumb" | "fav" | "favicon"| "url" | "export" | "use" | "preview"| undefined} SubCommand1
 * @typedef {"set" | "get" } SubCommand2
 */

/**
 * main plugin function
 * @param {PluginCtx} ctx 
 * @returns {Promise <any>}
 */

async function run(ctx) {
    const { m, text, themeManager, q, sock, jid } = ctx

    const split1 = getFirstStringAndRest(text)
    const split2 = getFirstStringAndRest(split1.restString)

    /**@type {SubCommand1} */
    const subCommand1 = split1.firstString

    /**@type {SubCommand2} */
    const subCommand2 = split2.firstString
    const param2 = split2?.restString?.substring(1)

    if (!subCommand1) {
        return await m.reply(String.NO_SUBCOMMAND_1)
    }

    else if (subCommand1 === "title") {
        if (subCommand2 === "set") {
            if (!param2) return await m.reply(String.TEXT_REQUIRE)
            const r = await themeManager.setTitle(param2)
            if (r.error) return await m.reply(r.error)
            return await m.react(Emoji.SUCCESS)
        } else if (subCommand2 === "get") {
            const title = themeManager.getData()?.title ?? `(title kosong)`
            return await m.reply(title)
        } else if (subCommand2 === "clear") {
            const r = await themeManager.setTitle(undefined)
            if (r.error) return await m.reply(r.error)
            return await m.react(Emoji.SUCCESS)
        } else {
            return await m.reply(String.SGC)
        }
    }

    else if (subCommand1 === "desc" || subCommand1 === "description") {
        if (subCommand2 === "set") {
            if (!param2) return await m.reply(String.TEXT_REQUIRE)
            const r = await themeManager.setDescription(param2)
            if (r.error) return await m.reply(r.error)
            return await m.react(Emoji.SUCCESS)
        }
        else if (subCommand2 === "get") {
            const title = themeManager.getData()?.description ?? `(title kosong)`
            return await m.reply(title)
        } else if (subCommand2 === "clear") {
            const r = await themeManager.setDescription(undefined)
            if (r.error) return await m.reply(r.error)
            return await m.react(Emoji.SUCCESS)
        } else {
            return await m.reply(String.SGC)

        }
    }

    else if (subCommand1 === "url") {
        if (subCommand2 === "set") {
            const r = await themeManager.setUrl(param2)
            if (r.error) return await m.reply(r.error)
            return await m.react(Emoji.SUCCESS)
        }
        else if (subCommand2 === "get") {
            const title = themeManager.getData()?.url ?? `(title kosong)`
            return await m.reply(title)
        } else {
            return await m.reply(String.URL)
        }
    }

    else if (subCommand1 === "thumb" || subCommand1 === "thumbnail") {
        if (subCommand2 === "set") {
            const validUrl = checkUrl(param2)
            let validQuoted
            if (q) {
                const normalizeQuoteMessage = normalizeMessageContent(q.message)
                const ct = getContentType(normalizeQuoteMessage)
                const mime = normalizeQuoteMessage?.[ct]?.mimetype
                if ((ct === "imageMessage" || ct === "documentMessage") && (mime?.startsWith("image/"))) {
                    validQuoted = true
                } else if (ct === "extendedTextMessage") {
                    validQuoted = Boolean(normalizeQuoteMessage?.extendedTextMessage?.mediaKey)
                }
            }

            if (validUrl && validQuoted) return await m.reply(`gak boleh reply dan url`)

            let stream
            if (validQuoted) {
                stream = await q.download()
            } else {
                const normalizeMessage = normalizeMessageContent(m.message)
                const ct = getContentType(normalizeMessage)
                if ((ct === "imageMessage" || ct === "documentMessage") && (normalizeMessage?.[ct]?.mimetype?.startsWith("image/"))) {
                    stream = await m.download()
                } else {
                    if (!param2) return await m.reply(`isikan url atau reply ke sebuah gambar / thumbnail`)
                    if (param2 && !validUrl) return await m.reply(`invalid url`)

                    // fetch from url as stream
                    const response = await fetch(validUrl)
                    if (!response.ok) return await m.reply(`respond dari server ${response.status}`)
                    const ct = response.headers.get("content-type")
                    if (!ct?.startsWith('image/')) return await m.reply(`aku kurang yakin dengan content type ${ct}. mungkin kamu bisa download gambarnya dulu baru set as thumbnail`)
                    stream = Readable.fromWeb(response.body)
                }
            }

            const wamc = await createThumbnailLink(sock, {
                image: { stream }
            })
            const r = await themeManager.setMessage(wamc)
            if (r.error) return await m.reply(r.error)
            return await m.react('✅')
        } else if (subCommand2 === "get") {
            const WAMessageContent = themeManager.getData()?.message
            if (!WAMessageContent?.extendedTextMessage?.mediaKey) return await m.reply(`gak bisa download tamnel :v`)
            const stream = await downloadMediaMessage({ message: WAMessageContent })
            return await sock.sendMessage(jid, {
                image: { stream }
            }, {
                quoted: m
            })
        } else if (subCommand2 === "height") {
            const r = await themeManager.overrideHightByRatio(param2)
            if (r.error) return await m.reply(r.error)
            return await m.react(Emoji.SUCCESS)
        } else if (subCommand2 === "stock") {
            const r = await themeManager.setMessage(undefined)
            if (r.error) return await m.reply(r.error)
            return await m.reply(r.data)
        } else {
            return await m.reply(`command invalid opsi tersedia
- set <url>
- set <reply ke image, thumbnail, doc image>
- set <upload image, thumbnail, doc image>
- get
- height <0.2 - 1>
- stock`)
        }
    }

    else if (subCommand1 === "fav" || subCommand1 === "favicon") {
        if (subCommand2 === "set") {
            const validUrl = checkUrl(param2)
            let validQuoted
            if (q) {
                const normalizeQuoteMessage = normalizeMessageContent(q.message)
                const ct = getContentType(normalizeQuoteMessage)
                const mime = normalizeQuoteMessage?.[ct]?.mimetype
                if ((ct === "imageMessage" || ct === "documentMessage") && (mime?.startsWith("image/"))) {
                    validQuoted = true
                } else if (ct === "extendedTextMessage") {
                    validQuoted = Boolean(normalizeQuoteMessage?.extendedTextMessage?.mediaKey)
                }
            }

            if (validUrl && validQuoted) return await m.reply(`gak boleh reply dan url`)

            let stream
            if (validQuoted) {
                stream = await q.download()
            } else {
                const normalizeMessage = normalizeMessageContent(m.message)
                const ct = getContentType(normalizeMessage)
                if ((ct === "imageMessage" || ct === "documentMessage") && (normalizeMessage?.[ct]?.mimetype?.startsWith("image/"))) {
                    stream = await m.download()
                } else {
                    if (!param2) return await m.reply(`isikan url atau reply ke sebuah gambar / thumbnail`)
                    if (param2 && !validUrl) return await m.reply(`invalid url`)

                    // fetch from url as stream
                    const response = await fetch(validUrl)
                    if (!response.ok) return await m.reply(`respond dari server ${response.status}`)
                    const ct = response.headers.get("content-type")
                    if (!ct?.startsWith('image/')) return await m.reply(`aku kurang yakin dengan content type ${ct}. mungkin kamu bisa download gambarnya dulu baru set as thumbnail`)
                    stream = Readable.fromWeb(response.body)
                }
            }

            stream = resizeImage(stream, 48)

            const wamc = await createThumbnailLink(sock, {
                image: { stream }
            })
            const r = await themeManager.setFavicon(wamc)
            if (r.error) return await m.reply(r.error)
            return await m.react('✅')
        } else if (subCommand2 === "get") {
            const favicon = themeManager.getData()?.message?.extendedTextMessage?.faviconMMSMetadata
            const stream = await downloadContentFromMessage({
                directPath: favicon?.thumbnailDirectPath,
                mediaKey: favicon?.mediaKey
            }, "thumbnail-link")
            return await sock.sendMessage(jid, {
                image: { stream }
            }, {
                quoted: m
            })
            return await m.reply(`sedang dikerjakan`)
        } else if (subCommand2 === "clear") {
            const result = await themeManager.setFavicon(undefined)
            if (result?.error) return await m.reply(result.error)
            return await m.react(Emoji.SUCCESS)
        } else {
            return await m.reply(`opsi tersedia
- set <url>
- set <reply ke image, thumbnail, doc image>
- set <upload image, thumbnail, doc image>
- get
- clear`)
        }
    }

    else if (subCommand1 === "export") {
        const data = JSON.stringify(themeManager.getData(), null, 2)
        const pefixFileName = sanitizeFileName(split1?.restString) ?? `theme`
        const ts = Date.now()

        const fileName = `${pefixFileName}-${ts}.json`
        return await sock.sendMessage(jid, {
            document: Buffer.from(data),
            fileName,
            mimetype: `application/json`,
            caption: `nih :v`
        })
    }

    else if (subCommand1 === "use") {
        if (!q) return await m.reply(`reply ke message, pastiin dokumen message json`)
        const qNormalized = normalizeMessageContent(q?.message)
        const qContent = getContentType(qNormalized)
        if (qContent !== "documentMessage") return await m.reply(`musti dokumen message`)
        if (qNormalized?.documentMessage?.mimetype !== "application/json") return await m.reply(`gak mau mime nya kurang meyakinkan`)
        try {
            const text = (await q.download("buffer")) + ''
            const json = JSON.parse(text)
            themeManager.useExternalJson(json)
            return await m.reply(`sip theme berhasil di ganti. coba test`)
        } catch (e) {
            return await m.reply(`gagal use theme ${e.message}`)
        }
    }

    else if (subCommand1 === "preview") {
        return await m.reply(`masih di buat`)
    }

    else {
        return await m.reply(String.INVALID_SUBCOMMAND)
    }
}

/** @type {Plugin} */
const plugin = {
    run,
    name: "theme manager",
    commands: ["theme"],
    categories: ["core"],
    description: "buat ubah title, description, thumbnail, url. dll. malas jelasin coba aja langsung panggil command nya :v"
}

plugin.meta = {
    fileName: "core-theme.js",
    version: "1",
    author: "wolep",
    note: "wakwau"
}

plugin.config = {
    protected: true
}

export default plugin