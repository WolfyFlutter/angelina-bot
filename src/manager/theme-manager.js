import fs from "node:fs/promises"
import path from "node:path"
import { defaultLock } from "../async-lock.js"
import { allPaths } from "../all-paths.js"
import { proto } from "baileys"

const CONFIG_PATH = allPaths.themeConfig
const DEFAULT_KEY = `sexy-theme` //random value untuk async lock
const HERE = `[theme-manager.js]` //buat log display

/**
 * @import {WAMessageContent} from "baileys"
 * @import {CommonResponse} from "../types/types.js"
 */

/**
 * @typedef {object} ThemeManagerData
 * @property {WAMessageContent} message
 * @property {string} url
 * @property {string|undefined} title
 * @property {string|undefined} description
 * @property {number} [thumbnailHeightRatioOverride]
 */

class ThemeManager {

    /**@type {ThemeManagerData} */
    config = {}

    /**
     * @returns {ThemeManagerData}
     */
    getData() {
        return this.config
    }

    /**
     * 
     * @param {WAMessageContent} message 
     * @returns {Promise<CommonResponse<string>>}
     */
    async setMessage(message) {
        try {
            const hasFavicon = this.config?.message?.extendedTextMessage?.faviconMMSMetadata?.mediaKey
            const hasExternalThumbnail = this?.config?.message?.extendedTextMessage?.mediaKey

            // delete message
            if (!message) {
                if (!hasExternalThumbnail) {
                    return { error: `thumbnail sudah stock` }
                }
                let tempFavicon
                if (hasFavicon) tempFavicon = this.config?.message?.extendedTextMessage?.faviconMMSMetadata
                this.config.message = (await this.getDefaultConfig())?.message
                this.config.message.extendedTextMessage.faviconMMSMetadata = tempFavicon
                await this.saveConfig()
                return { data: `thumbnail berhasil di set ke default` }
            } else {
                let tempFavicon
                if (hasFavicon) tempFavicon = this.config?.message?.extendedTextMessage?.faviconMMSMetadata
                this.config.message = message
                this.config.message.extendedTextMessage.faviconMMSMetadata = tempFavicon

                delete this.config.thumbnailHeightRatioOverride
                await this.saveConfig()
                return { data: `thumbnail berhasil di perbarui` }
            }
        } catch (e) {
            return { error: e.message }
        }
    }

    /**
     * 
     * @param {WAMessageContent} message 
     * @returns {Promise<CommonResponse<string>>}
     */
    async setFavicon(message) {
        if (!message) {
            if (!this.config?.message?.extendedTextMessage?.faviconMMSMetadata) return { error: `favicon sudah kosong nothing changes` }
            delete this.config?.message?.extendedTextMessage?.faviconMMSMetadata
            await this.saveConfig()
            return { data: `favicon berhasil di hapus` }
        } else {
            const { extendedTextMessage: e } = message
            const faviconMMSMetadata = {
                "thumbnailDirectPath": e.thumbnailDirectPath,
                "thumbnailSha256": e.thumbnailSha256,
                "thumbnailEncSha256": e.thumbnailEncSha256,
                "mediaKey": e.mediaKey,
                "mediaKeyTimestamp": e.mediaKeyTimestamp,
                "thumbnailHeight": e.thumbnailHeight,
                "thumbnailWidth": e.thumbnailWidth
            }
            Object.assign(this.config.message.extendedTextMessage, {
                faviconMMSMetadata: proto.Message.ExtendedTextMessage.create(faviconMMSMetadata)
            })
            //this.config.message = proto.Message.fromObject(this.config.message)
            await this.saveConfig()
            return { data: `favicon berhasil di perbarui` }
        }
    }

    /**
     * 
     * @param {string|undefined} url 
     * @returns {Promise<CommonResponse<string>>}
     */
    async setUrl(url) {
        try {
            const validUrl = /^\s*https?:\/\//.test(url)
            if (!validUrl) return { error: `url harus string dan pastikan benar` }
            const urlTrim = url.trim()
            if (this.config?.url === urlTrim) return { error: `url sama dengan sebelumnya. nothing changes` }
            this.config.url = urlTrim
            await this.saveConfig()
            return { data: `sip coba test menunya` }
        } catch (e) {
            console.error(e)
            return { error: `catch error ${e.message}` }
        }
    }

    /**
     * 
     * @param {string|undefined} title 
     * @returns {Promise<CommonResponse<string>>}
     */
    async setTitle(title) {
        try {
            const titleType = typeof (title)

            const stringOrUndefined = titleType === "string" || titleType === "undefined"
            if (!stringOrUndefined) return { error: `param harus tipe string. ${titleType} diterima` }

            const isDescEmptyAndTitleEmpty = !this.config.description && !title
            if (isDescEmptyAndTitleEmpty) return { error: `kamu gak bisa punya title kosong kalau deskripsi nya juga kosong.` }

            const isTitleEmpty = titleType === "undefined" || !title
            if (this.config?.title === undefined && isTitleEmpty) return { error: `title sudah kosong. nothing changes` }

            const isTitleSame = this.config.title === title
            if (isTitleSame) return { error: `title sama. nothing changes` }

            this.config.title = title || undefined
            await this.saveConfig()
            return { data: title ? `title berhasil di set menjadi ${title}` : `title berhasil di hapus` }

        } catch (e) {
            console.error(e)
            return { error: `catch error ${e.message}` }
        }
    }

    /**
     * 
     * @param {string|undefined} description 
     * @returns {Promise<CommonResponse<string>>}
     */
    async setDescription(description) {
        try {
            const titleType = typeof (description)

            const stringOrUndefined = titleType === "string" || titleType === "undefined"
            if (!stringOrUndefined) return { error: `param harus tipe string. ${titleType} diterima` }

            const isTitleEmptyAndDescEmpty = !this.config.title && !description
            if (isTitleEmptyAndDescEmpty) return { error: `kamu gak bisa punya description kosong kalau title nya juga kosong.` }

            const isDescriptionEmpty = titleType === "undefined" || !description
            if (this.config?.description === undefined && isDescriptionEmpty) return { error: `description sudah kosong. nothing changes` }

            const isDescriptionSame = this.config.description === description
            if (isDescriptionSame) return { error: `deskripsi sama. nothing changes` }

            this.config.description = description || undefined
            await this.saveConfig()
            return { data: description ? `description berhasil di set menjadi ${description}` : `description berhasil di hapus` }

        } catch (e) {
            console.error(e)
            return { error: `catch error ${e.message}` }
        }
    }

    /**
     * 
     * @returns {Promise<ThemeManagerData>}
     */
    async getDefaultConfig() {
        return {
            message: {
                extendedTextMessage: {
                    jpegThumbnail: await fs.readFile(path.join(allPaths.media, 'furry.png'), { encoding: 'base64' })
                }
            },
            description: "made by wolep",
            title: 'angelina bot',
            url: 'https://github.com/WolfyFlutter/angelina-bot'
        }
    }

    async saveConfig() {
        return await defaultLock.withLock(`${DEFAULT_KEY}:save`, async () => {
            const destinationDir = path.dirname(CONFIG_PATH)
            await fs.mkdir(destinationDir, { recursive: true })
            await fs.writeFile(CONFIG_PATH, JSON.stringify(this.config, null, 2))
        })
    }

    async loadConfig() {
        return await defaultLock.withLock(`${DEFAULT_KEY}:load`, async () => {
            try {
                const file = await fs.readFile(CONFIG_PATH, { encoding: 'utf-8' })
                /**@type{ThemeManagerData} */
                const json = JSON.parse(file)
                this.config = {
                    message: proto.Message.fromObject(json.message),
                    ...json,
                }
            } catch (e) {
                if (e.code === "ENOENT") {
                    this.config = await this.getDefaultConfig()
                    await this.saveConfig()
                } else {
                    console.error(`${HERE} unknown error ${e.message}\nreplace old config with default config`, e)
                    this.config = await this.getDefaultConfig()
                    await this.saveConfig()
                }

            }
        })
    }

    /**
     * @returns {Promise<CommonResponse<string>>}
     */
    async nuke() {
        try {
            this.config = await this.getDefaultConfig()
            await this.saveConfig()
            return { data: `theme di set ke default` }
        } catch (e) {
            return { error: `catch error ${e.message}` }
        }
    }

    async init() {
        await this.loadConfig()
    }

    /**
     * 
     * @param {ThemeManagerData} json 
     */
    async useExternalJson(json) {
        this.config = json
        await this.saveConfig()
    }

    /**
     * 
     * @param {number|undefined} sanitize 
     * @returns {Promise<CommonResponse<string>>}
     */
    async overrideHightByRatio(num) {
        let sanitize = parseFloat(num)
        sanitize = num ?? 1
        if (isNaN(sanitize)) return { error: `invalid number` }
        if (sanitize < 0.2) return { error: `minimal 0.2` }
        if (sanitize > 1) return { error: `maksimal 1` }
        this.config.thumbnailHeightRatioOverride = sanitize
        await this.saveConfig()
        return { data: `sip` }
    }
}

const themeManager = new ThemeManager()
await themeManager.init()

export { themeManager }