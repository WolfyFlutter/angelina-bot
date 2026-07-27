/**
 * @import {Plugin, PluginCtx, CommonResponseOld, PluginVerifikatorResponse} from "../types/types.js"
 */

import { pathToFileURL } from "node:url"
import { randomUUID } from "node:crypto"
import { mkdir, rm, writeFile } from "node:fs/promises"
import path, { dirname } from "node:path"
import fs from "node:fs"

import { allPaths } from "../all-paths.js"
import { pluginManagerLock } from "../async-lock.js"
import { pluginVerifikator } from "../plugin-verifikator.js"

const ASYNC_LOCK_KEY = "wakwau"


/**
 * ini cuma wrapper yang ngembaliin objek dengan type commonResponse
 * @param {string} message pesan error
 * @returns {CommonResponseOld}
 */
const fail = (message) => ({
    ok: false,
    message
})

/**
 * ini cuma wrapper yang ngembaliin objek dengan type commonResponse
 * @param {string} message pesan error
 * @returns {CommonResponseOld}
 */
const success = (message) => ({
    ok: true,
    message
})



class PluginManager {
    /**@type {Map<string, Plugin>} */
    pluginMap = new Map()


    /**@type {Array<Plugin>} */
    pluginArray = []

    async init() {
        this.pluginMap.clear()
        this.pluginArray.length = 0

        // import semua plugin, taruh di array
        const now = Date.now()
        const files = await fs.promises.readdir(allPaths.plugins)
        for (const file of files) {
            const filePath = path.join(allPaths.plugins, file)
            const filePathUrl = pathToFileURL(filePath).href + "?time=" + now
            const plugin = await import(filePathUrl)
            

            // tambah path ke plugin
            plugin.default.path = filePath

            this.pluginArray.push(plugin.default)
        }

        // bawa plugin ke map, key nya adalah command plugin
        for (const plugin of this.pluginArray) {
            const commands = plugin.commands
            commands.forEach(command => {
                this.pluginMap.set(command, plugin)
            })
        }

    }

    /**
     * @param {Buffer} buffer 
     * @param {Boolean} isReplaceInstall 
     * @returns {CommonResponseOld}
     */
    async install(buffer, isReplaceInstall) {
        return await pluginManagerLock.withLock(ASYNC_LOCK_KEY, async () => {
            const TEMP_PLUGIN_PATH = path.join(allPaths.pluginTemp, randomUUID() + '.js')
            try {
                const parrentDir = dirname(TEMP_PLUGIN_PATH)
                await mkdir(parrentDir, {
                    recursive: true
                })
                await writeFile(TEMP_PLUGIN_PATH, buffer)
                const module = await import(pathToFileURL(TEMP_PLUGIN_PATH))
                const verifikator = pluginVerifikator(module, isReplaceInstall)

                if (verifikator.status === "install") {
                    /**@type {Plugin} */
                    const newPlugin = module.default
                    newPlugin.path = path.join(allPaths.plugins, newPlugin.meta.fileName)

                    // copy file plugin ke direktory plugin
                    await writeFile(newPlugin.path, buffer)

                    // tambah plugin ke array
                    this.pluginArray.push(newPlugin)

                    // tambah command plugin ke map
                    for (const cmd of newPlugin.commands) {
                        this.pluginMap.set(cmd, newPlugin)
                    }

                    return success(verifikator.message)
                }

                else if (verifikator.status === "replace") {

                    /**@type {Plugin} */
                    const newPlugin = module.default
                    newPlugin.path = path.join(allPaths.plugins, newPlugin.meta.fileName)

                    // delete plugin
                    for (const cmd of newPlugin.commands) {
                        await this.deletePlugin(cmd)
                    }

                    // copy file plugin ke direktory plugin
                    await writeFile(newPlugin.path, buffer)

                    // tambah plugin ke array
                    this.pluginArray.push(newPlugin)

                    // tambah command plugin ke map
                    for (const cmd of newPlugin.commands) {
                        this.pluginMap.set(cmd, newPlugin)
                    }

                    return success(verifikator.message)
                }

                else if (verifikator.status === "fail") {
                    return fail(verifikator.message)
                }
            } catch (e) {
                console.error(e)
                return fail(e.message)
            } finally {
                await rm(TEMP_PLUGIN_PATH)
            }
        })
    }


    /**
     * 
     * @param {string} command 
     * @returns {Promise <managerResponse>}
     */
    async deletePlugin(command) {
            try {
                if (!command) return fail(`😮‍💨 mau hapus plugin apa sayang? kasih dong command nya...`)

                // cek plugin ada apa engga
                const plugin = this.pluginMap.get(command)

                if (!plugin) return fail(`👻 wakwau.. kamu gak punya plugin dengan command *${command}*`)

                // cek apakah plugin protected
                if (plugin?.config?.protected) return fail(`hell nah.. how about no.. plugin *${plugin.name}* adalah plugin protected. kamu bisa melihat semua plugin protected denagn command --protected`)

                // hapus file dari folder plugin
                await fs.promises.rm(plugin.path)

                // hapus plugin dari map
                for (const cmd of plugin.commands) {
                    this.pluginMap.delete(cmd)
                }

                // hapus plugin dari array
                const pluginIndex = this.pluginArray.findIndex(p => {
                    return p.commands.some(cmd => cmd === command)
                })
                this.pluginArray.splice(pluginIndex, 1)

                // susun kata kata dulu dong
                const kataKata = `*✅ plugin berhasil di uninstall*\n` +
                    `nama: ${plugin.name}\n` +
                    `command: ${plugin.commands.join(', ')}\n` +
                    `path: ${plugin.path}`
                return success(kataKata)

            } catch (e) {
                console.error(`gagal hapus plugin`, e)
                return fail('error: ' + e.message)
            }
        
    }

    /**
     * @param {string} command plugin command
     * @returns {Plugin | undefined}
     */
    getPlugin(command) {
        if (!command) return undefined
        return this.pluginMap.get(command)
    }

    /**
     * fungsi yang mengembalikan string yang berisi info plugin protected
     * @returns {string} list plugin protected
     */
    getProtectedPluginString() {
        return this.pluginArray
            .filter(plugin => plugin?.config?.protected)
            .map(plugin => {
                const name = plugin.name
                const cmds = plugin.commands.join(', ')
                return `${cmds} (${name})`
            }).sort().join("\n")
    }

    /**
     * fungsi yang mengembalikan string yang berisi info plugin protected
     * @returns {string} list plugin protected
     */
    getBypassPluginString() {
        return this.pluginArray
            .filter(plugin => plugin?.config?.bypassPrefix)
            .map(plugin => {
                const name = plugin.name
                const cmds = plugin.commands.join(', ')
                return `${cmds} (${name})`
            }).sort().join("\n")
    }
}

const pluginManager = new PluginManager()
await pluginManager.init()

export { pluginManager }