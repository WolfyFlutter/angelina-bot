/**
 * @import { PluginCtx, Plugin } from "../types/types.js"
 */

import { exec } from "node:child_process"
import { promisify } from "node:util"

const sh = promisify(exec)
const MAX_REPLY = 3500

/**
 * @param {PluginCtx} ctx
 */
async function run(ctx) {
    const { m, text, sock, jid } = ctx

    if (!text) {
        return await m.reply("Masukkan perintah shell.")
    }

    try {
        const { stdout, stderr } = await sh(text, {
            windowsHide: true,
            maxBuffer: 20 * 1024 * 1024
        })

        const output = (stdout || stderr || "Done.").trim()

        if (output.length <= MAX_REPLY) {
            return await m.reply(output)
        }

        return await sock.sendMessage(jid, {
            document: Buffer.from(output),
            mimetype: "text/plain",
            fileName: "shell-output.txt"
        }, { quoted: m })

    } catch (err) {
        const output = `${err.stdout || ""}${err.stderr || err.message}`.trim()

        if (output.length <= MAX_REPLY) {
            return await m.reply(output)
        }

        return await sock.sendMessage(jid, {
            document: Buffer.from(output),
            mimetype: "text/plain",
            fileName: "shell-error.txt"
        }, { quoted: m })
    }
}

/** @type {Plugin} */
const plugin = {
    run,
    name: "shell",
    commands: ["$"],
    categories: ["core"],
    description: "menjalankan perintah shell"
}

plugin.meta = {
    fileName: "core-shell.js",
    version: "1",
    author: "wolep",
    note: "execute shell command"
}

export default plugin