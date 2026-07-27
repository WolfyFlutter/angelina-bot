/**
 * @import {WASocket} from "baileys"
 */

/**
 * @typedef FetchAllParticipantConfig
 * @property {number|undefined} lastFetch berisi unix timestamp second
 * @property {string|undefined} fetchBy berisi pn
 */

import { jidNormalizedUser, unixTimestampSeconds } from "baileys"

import { allPaths } from "../all-paths.js"
import { formatSecond } from "../helper/common.js"

import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname } from "node:path"

class FetchAllParticipant {
    #FILE_PATH = allPaths.fetchAllParticipant
    #SEVEN_DAYS = 60 * 60 * 24 * 7
    
    /**@type {FetchAllParticipantConfig} */
    config

    /**
     * @returns {FetchAllParticipantConfig}
     */
    getDefaultConfig() {
        return {
            fetchBy: undefined,
            lastFetch: undefined
        }
    }

    async loadConfig() {
        try {
            const file = await readFile(this.#FILE_PATH, { encoding: "utf-8" })
            this.config = JSON.parse(file)
        } catch (e) {
            this.config = this.getDefaultConfig()
            console.warn(`[fetch all participant] no config found`)
            await this.saveConfig()
        }
    }

    async saveConfig() {
        try {
            await mkdir(dirname(this.#FILE_PATH), {
                recursive: true
            })
            await writeFile(this.#FILE_PATH,
                JSON.stringify(this.config, null, 2)
            )
        } catch (e) {
            console.error(`[fetch all participant] error ${this.#FILE_PATH}`, e)
        }
    }

    /**
     * 
     * @param {WASocket} sock 
     * @returns {Promise <void>}
     */
    async fetchAllPartcicipant(sock) {
        const botPn = jidNormalizedUser(sock.user.id)
        const now = unixTimestampSeconds()

        if (this.config.fetchBy !== botPn) {
            await sock.groupFetchAllParticipating()
            this.config.fetchBy = botPn
            this.config.lastFetch = now
            await this.saveConfig()
            return
        }

        const lastFetch = this?.config?.lastFetch ?? 0
        const hasPassed7Days = now -lastFetch >= this.#SEVEN_DAYS

        if (hasPassed7Days) {
            await sock.groupFetchAllParticipating()
            this.config.lastFetch = now
            await this.saveConfig()
        } else {
            const second = this.config.lastFetch + this.#SEVEN_DAYS - now
            console.log(`sudah fetching all participant, fetch berikutnya lagi ${formatSecond(second)}`)
        }
    }
}

const fetchAllParticipant = new FetchAllParticipant()
await fetchAllParticipant.loadConfig()

export { fetchAllParticipant }
