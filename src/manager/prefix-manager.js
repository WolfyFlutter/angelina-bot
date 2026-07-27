/**
 * @import {CommonResponseOld, PrefixResult , PrefixStatus} from "../types/types.js"
 */

import { mkdir, writeFile, readFile } from "node:fs/promises"
import { dirname } from "node:path"

import { pluginManager } from "./plugin-manager.js"
import { allPaths } from "../all-paths.js"

const PREFIX_CONFIG_PATH = allPaths.prefixConfig

// ubah kata kata disini kalau mau
const string = {
    SUCCESS_OFF: `✅ prefix berhasil di matikan`,
    SUCCESS_ON: ` ✅ prefix berhasil di aktifkan`,
    NOTHING_CHANGE_OFF: `prefix udh mati kok. nothing change`,
    NOTHING_CHANGE_ON: `prefix udh nyala. nothing change`
}

const DEFAULT_PREFIX_FLAG = false
const DEFAULT_PREFIX_LIST = ["."]

/**@returns {CommonResponseOld} */
const failResponse = message => {
    return {
        ok: false,
        message
    }
}

/**@returns {CommonResponseOld} */
const successResponse = message => {
    return {
        ok: true,
        message
    }
}

class PrefixManager {
    /**@type {boolean} */
    #isPrefixActive = DEFAULT_PREFIX_FLAG

    /**@type {string[]} */
    #prefixList = DEFAULT_PREFIX_LIST

    /**
     * mengembalikan status prefix
     * @returns {PrefixStatus}
     */
    getStatus() {
        return {
            isPrefixActive: this.#isPrefixActive,
            prefixList: Object.freeze([...this.#prefixList])
        }
    }

    /**
     * 
     * @param {string} text 
     * @returns {Promise<CommonResponseOld>}
     */
    async addPrefix(text) {
        if (!text) return {
            ok: false,
            message: `input gak boleh kosong`
        }

        if (typeof (text) !== "string") {
            return {
                ok: false,
                message: `tipe input harus string`
            }
        }

        if (/\s/.test(text)){
            return {
                ok : false,
                message: 'prefix gak boleh isi whitespace. single word aja kaya lu yang single'
            }
        }

        // cek apakah prefix sudah ada
        const prefixExist = this.#prefixList.some(prefix => prefix === text)
        if (prefixExist) {
            return {
                ok: false,
                message: `prefix ${text} sudah ada`
            }
        }

        // cek apakah prefix bentrok dengan plugin yang punya konfig bypassPrefix
        const plugin = pluginManager.getPlugin(text)
        if (plugin?.config?.bypassPrefix) {
            return {
                ok: false,
                message: `woops prefix mu itu sudah reserved untuk plugin *${plugin.name}*. coba input prefix yang lain. buat liat full reserved prefix gunakan param *--reserved*`
            }
        }

        // add prefix to array
        this.#prefixList.push(text.trim())
        await this.saveConfig()
        return {
            ok: true,
            message: `prefix ${text} berhasil di tambahkan`
        }
    }

    getDefaultConfig() {
        return {
            isPrefixActive: DEFAULT_PREFIX_FLAG,
            prefixList: [...DEFAULT_PREFIX_LIST]
        }
    }

    /**
     * fungsi yang buat resolve prefix, liat aja
     * @param {string|undefined} text 
     * @returns {PrefixResult}
     */
    resolvePrefix(text) {
        if (!text) return {
            ok: false,
            prefix: undefined,
            data: undefined
        }

        if (this.#isPrefixActive) {
            for (const prefix of this.#prefixList) {
                if (text.startsWith(prefix)) {
                    const textWithoutPrefix = text.slice(prefix.length).trimStart()
                    return {
                        ok: true,
                        prefix,
                        data: textWithoutPrefix
                    }
                }
            }

            return {
                ok: false,
                prefix: undefined,
                data: text
            }
        }

        else {
            return {
                ok: true,
                prefix: undefined,
                data: text
            }
        }
    }

    /**
     * fungsi untuk menghidupkan prefix, handle ya response nya
     * @return {Promise <CommonResponseOld>}
     */
    togglePrefixOn = async () => {
        if (this.#isPrefixActive) {
            return {
                ok: false,
                message: string.NOTHING_CHANGE_ON
            }
        } else {
            this.#isPrefixActive = true
            await this.saveConfig()
            return {
                ok: true,
                message: string.SUCCESS_ON
            }
        }
    }

    /**
     * fungsi untuk matikan prefix, handle ya response nya
     * @return {Promise <CommonResponseOld>}
     */
    togglePrefixOff = async () => {
        if (this.#isPrefixActive) {
            this.#isPrefixActive = false
            await this.saveConfig()
            return {
                ok: true,
                message: string.SUCCESS_OFF
            }
        } else {
            return {
                ok: false,
                message: string.NOTHING_CHANGE_OFF
            }
        }
    }

    /**
     * fungsi untuk menyimpan konfig prefix
     * @returns {Promise <void>}
     */
    async saveConfig() {
        const data = {
            isPrefixActive: this.#isPrefixActive,
            prefixList: this.#prefixList
        }

        const parrentDir = dirname(PREFIX_CONFIG_PATH)
        await mkdir(parrentDir, {
            recursive: true
        })

        await writeFile(PREFIX_CONFIG_PATH, JSON.stringify(data, null, 2))
    }

    /**
     * fungsi untuk membaca config prefix dari file dan menyimpannya ke ram
     * kalau gagal baca config prefix dari file maka akan fallback ke default
     * prefix
     * @returns {Promise <void>}
     */
    async loadConfig() {
        try {
            const file = await readFile(
                PREFIX_CONFIG_PATH,
                "utf-8"
            )
            const config = JSON.parse(file)
            const fallback = this.getDefaultConfig()

            this.#isPrefixActive =
                typeof config.isPrefixActive === "boolean"
                    ? config.isPrefixActive
                    : fallback.isPrefixActive

            this.#prefixList =
                Array.isArray(config.prefixList)
                    ? config.prefixList
                    : fallback.prefixList

        } catch (e) {
            console.warn(`[prefix namager] no config found, creating new one`)
            const fallback = this.getDefaultConfig()
            this.#isPrefixActive = fallback.isPrefixActive
            this.#prefixList = fallback.prefixList
            await this.saveConfig()
        }
    }

    /**
     * fungsi untuk mereset prefix list ke default
     * @returns {Promise <CommonResponseOld>}
     */
    async setToDefaultPrefixList() {
        this.#prefixList = this.getDefaultConfig().prefixList
        await this.saveConfig()
        return {
            ok: true,
            message: `prefix list di hapus semua dan list nya di set ke default`
        }
    }

    /**
     * 
     * @param {number} index index nya di mulai dari 1 ya misal prefix nya ada 3, index nya adalah 1, 2, 3, kalau input 4 maka error, kalau input 0 maka error
     * @returns {Promise <CommonResponseOld>}
     */
    async deletePrefix(index) {
        if (!index) return failResponse(`input gak boleh falsy`)
        if (isNaN(index)) return failResponse(`input harus valid integer`)
        if (index <= 0) return failResponse(`index gak boleh negatif atau 0`)
        if (index > this.#prefixList.length) return failResponse(`index gak boleh lebih dari ${this.#prefixList.length}`)
        if (this.#prefixList.length <= 1) return failResponse(`prefix cuma sisa 1, gak bisa di hapus`)

        const elementRemoved = this.#prefixList.splice(index - 1, 1)
        await this.saveConfig()
        return successResponse(`prefix ${elementRemoved} berhasil di hapus`)
    }
}

const prefixManager = new PrefixManager()
prefixManager.loadConfig()
export { prefixManager }

