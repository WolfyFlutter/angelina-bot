import { allPaths } from "../all-paths.js"
import { tempFileLock } from "../async-lock.js"
import { getContentType, downloadMediaMessage } from "baileys"
import path from 'node:path'
import Stream from 'node:stream'
import fs from "node:fs"
import crypto from 'node:crypto'



const yardanUploader = async (filePath, { forcedFilename }) => {

    // resolve payload
    const originalFileName = forcedFilename || path.basename(filePath)
    const rawBuffer = await fs.promises.readFile(filePath)
    const encKey = crypto.randomBytes(32)
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', encKey, iv)
    const encryptedBuffer = Buffer.concat([iv, cipher.update(rawBuffer), cipher.final()])
    const blob = new Blob([encryptedBuffer])
    const formData = new FormData()
    formData.append('file', blob, originalFileName + '.enc')

    const res = await fetch('https://cloud.yardansh.com/upload', {
        method: 'POST',
        body: formData
    })

    if (!res.ok) {
        throw new Error(`Upload failed: ${res.status} ${res.statusText}`)
    }

    const data = await res.json()
    return data
}

/**
 * @import {Plugin, PluginCtx, } from "../types/types.js"
 */

/**
 * 
 * @param {PluginCtx} ctx 
 * @returns {Promise <void>}
 */
async function run(ctx) {
    const { m, q, sock, jid } = ctx

    // DEFINE YOUR TEMP PATH FIRST HERE
    const TEMP_PATH = allPaths.temp

    // boilerplate
    const wam = q || m
    let wam2 = {}
    let isFileCached = false

    const safeWriteStream = async (filePath, inputStream) => {
        const dirname = path.dirname(filePath)
        await fs.promises.mkdir(dirname, { recursive: true })
        try {
            const writeStream = fs.createWriteStream(filePath, { flags: 'wx' })
            await Stream.promises.pipeline(inputStream, writeStream)
            return
        } catch (err) {
            if (err.code === 'EEXIST') {
                isFileCached = true
                return
            }
            throw err
        }
    }


    // if content in interactive button
    const isInteractiveMessageHasMedia = wam.message?.interactiveMessage?.header?.hasMediaAttachment
    if (isInteractiveMessageHasMedia) {
        const ct = getContentType(wam.message.interactiveMessage.header)
        wam2.message = wam.message.interactiveMessage.header
        wam2.content = ct
    } else {
        wam2 = wam
        wam2.content = wam.content
    }


    // find media key
    const mediaKey = wam2.message[wam2.content]?.mediaKey
    if (!mediaKey) return await wam.reply('cant find media key')

    // find mime
    let mimetype = wam2.message[wam2.content]?.mimetype
    if (!mimetype && wam2.content === 'extendedTextMessage') {
        mimetype = 'image/jpeg'
    }
    if (!mimetype) return await wam.reply(`cant find mimetype`)

    // generate filename and extension
    const fileExt = mimetype.split('/')?.[1]
    if (!fileExt) return await wam.reply(`cant resolve file extension`)

    const fileName = Buffer.from(mediaKey).toString('base64url')
    const filenameWithExtension = `${fileName}.${fileExt}`
    const filePath = path.join(TEMP_PATH, filenameWithExtension)

    // filename for url
    const fnu = wam?.message?.documentMessage?.fileName

    // save to disk by stream
    // use lock biar gak tabrakan

    await tempFileLock.withLock(fileName, async () => {
        const mediaStream = await downloadMediaMessage(wam2, 'stream')
        await safeWriteStream(filePath, mediaStream)
    })

    // begin upload
    const result = await yardanUploader(filePath, { forcedFilename: fnu })

    
    // button send
    return await sock.relayMessage(
        jid,
        {
            interactiveMessage: {
                header: {
                    title: 'file uploaded' + (isFileCached ? '(cached)' : '')
                },
                body: {
                    text:
                        `expire : ${result.expiresAt}\n` +
                        `size : ${result.size}\n` +
                        `mime : ${mimetype}`

                },
                footer: { text: 'powered by cloud.yardansh.com' },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: "cta_copy",
                            buttonParamsJson: JSON.stringify({
                                display_text: "copy url",
                                copy_code: result.url
                            })
                        },
                        {
                            "name": "cta_url",
                            "buttonParamsJson": JSON.stringify({
                                "display_text": "visit url",
                                "url": result.url,
                            }, null, 2)
                        },

                    ]

                },
                contextInfo: {
                    stanzaId: wam.key.id,
                    participant: wam.key.participant || wam.key.remoteJid,
                    quotedMessage: wam.message
                }
            }
        },
        {

            additionalNodes: [
                {
                    tag: "biz",
                    attrs: {},
                    content: [
                        {
                            tag: "interactive",
                            attrs: {
                                type: "native_flow",
                                v: "1",
                            },
                            content: [
                                {
                                    tag: "native_flow",
                                    attrs: {
                                        v: "9",
                                        name: "mixed",
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],

        }
    );
}

/**@type {Plugin} */
const plugin = { run }

plugin.name = "file uploader"
plugin.commands = ["tourl","up"]
plugin.categories = ["other"]
plugin.description = "unggah file apapun ke internet dan dapatkan url untuk mengunduhnya. powered by https://cloud.yardansh.com"

plugin.meta = {
    fileName: "upload-file.js",
    author: "wolep",
    note: "makasih buat shaq atas service uploader nya. go check the website guys",
    version: "1",
    url: "https://cloud.yardansh.com"
}

plugin.config = {
    removeFirstUrl: true
}

export default plugin