import { getFirstStringAndRest } from "../helper/common.js"
import { allPaths } from "../all-paths.js"
import { writeFile, mkdir, unlink, access } from "node:fs/promises"
import { defaultLock } from "../async-lock.js"
import path, { join } from "node:path"

/**
 * @import {PluginCtx, Plugin} from "../types/types.js"
 * @typedef { "save" | "delete " | "saveFresh" | "check" | undefined} subCommand
 */

/**
 * main plugin function
 * @param {PluginCtx} ctx 
 * @returns {Promise <any>}
 */

async function run(ctx) {
    const { text, m, sock, jid } = ctx

    if (!m.isGroup) return await m.reply("hanya bisa di group")

    const { firstString, restString } = getFirstStringAndRest(text)

    /**@type {subCommand} */
    const subCommand = firstString
    const restText = restString ? restString.trim() : ''

    if (restText) return await m.reply(`invalid param ${restText}`)

    if (!subCommand) {
        return await m.reply(`opsi tersedia:\n- check\n- save\n- delete\n- saveFresh`)
    }

    else if (subCommand === "check") {
        const fileName = jid + ".json"
        const PATH = path.join(allPaths.temp, fileName)
        const result = await defaultLock.withLock(fileName, async () => {
            try {
                await access(PATH)
                return "saved offline"
            } catch (e) {
                return "clear"
            }
        })
        return await m.reply(`group metadata: ${result}`)
    }

    else if (subCommand === "save") {
        const gm = await sock.ws.config.cachedGroupMetadata(jid)
        if (!gm) return await m.reply(`gagal mendapatkan group metadata`)

        const fileName = gm.id + ".json"
        const PATH = path.join(allPaths.temp, fileName)

        await defaultLock.withLock(fileName, async () => {
            await mkdir(path.dirname(PATH), { recursive: true })
            await writeFile(PATH, JSON.stringify(gm, null, 2))
        })

        return await m.reply(`group metadata saved in ${PATH}`)
    }

    else if (subCommand === "delete") {
        const fileName = jid + ".json"
        const PATH = path.join(allPaths.temp, fileName)

        const result = await defaultLock.withLock(fileName, async () => {
            try {
                await unlink(PATH)
                return "berhasil di hapus"
            } catch (e) {
                if (e.code === "ENOENT") {
                    return "sudah gak ada"
                } else {
                    throw e
                }
            }
        })

        return await m.reply(result)
    }

    else if (subCommand === "saveFresh") {
        const gm = await sock.groupMetadata(jid)
        if (!gm) return await m.reply(`gagal mendapatkan fresh group metadata`)

        const fileName = gm.id + ".json"
        const PATH = join(allPaths.temp, fileName)

        await defaultLock.withLock(fileName, async () => {
            await mkdir(path.dirname(PATH), { recursive: true })
            await writeFile(PATH, JSON.stringify(gm, null, 2))
        })

        return await m.reply(`fresh group metadata berhasil di simpan. ada di folder temp dengan nama ${fileName}`)
    }

    else {
        return await m.reply(`invalid sub command`)
    }
}

/** @type {Plugin} */
const plugin = {
    run,
    name: "group metadata",
    commands: ["gm"],
    categories: ["dev"],
    description: "buat save group metadata offline biar gak fetch terus, ideal kalau sering restart bot dan mau test di gc"
}

plugin.meta = {
    fileName: "debug-save-group-metadata.js",
    version: "1",
    author: "wolep",
    note: "hmm"
}

export default plugin