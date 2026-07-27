/**
 * @import {FirstStringAndRestResponse} from "../types/types.js"
 */
import { config } from "../config.js"

/**
 * 
 * @param {string|undefined} string 
 * @param {number} [maxLength]
 * @returns {string|undefined}
 */
export const sexyTrim = (string, maxLength = 20) => {

    if (typeof (string) !== "string") return undefined
    if (string.length > maxLength) {
        const result = string.substring(0, maxLength - 1) + '…'
        return result
    }
    return string
}

/**
 * Format bytes menjadi string yang mudah dibaca.
 *
 * @param {number} bytes
 * @param {number} decimals Jumlah angka di belakang koma.
 * @returns {string}
 */
export function formatBytes(bytes, decimals = 2) {
    if (!Number.isFinite(bytes)) return "0 B";
    if (bytes === 0) return "0 B";

    const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${parseFloat((bytes / 1024 ** i).toFixed(decimals))} ${units[i]}`;
}

/**
 * 
 * @param {string|number} second detik
 * @returns {string} kayak 8 menit 1 detik
 */
export const formatSecond = (second) => {
    let s = Math.floor(second)
    const mf = Math.floor

    const d = mf(s / 86400)
    s -= d * 86400

    const h = mf(s / 3600)
    s -= h * 3600

    const m = mf(s / 60)
    s -= m * 60

    const sd = d ? `${d} hari ` : ""
    const sh = h ? `${h} jam ` : ""
    const sm = m ? `${m} menit ` : ""
    const ss = s ? `${s} detik` : ""

    return (sd + sh + sm + ss).trimEnd() || "< 1 detik"
}

/**
 * fungsi bang mengambil kata atau kalimat, dan me return kata pretama dan sisanya, pemisah adalah spasi atau enter
 * @param {string} string - input string
 * @returns {FirstStringAndRestResponse}
 */
export const getFirstStringAndRest = (string) => {
    if (typeof string !== "string") return {
        firstString: undefined,
        restString: undefined
    }

    // trim start dulu
    const trimmedStart = string.trimStart()
    if (!trimmedStart) return {
        firstString: undefined,
        restString: undefined
    }

    const spaceIndex = trimmedStart.indexOf(" ")
    const enterIndex = trimmedStart.indexOf("\n")

    if (spaceIndex === -1 && enterIndex === -1) return {
        firstString: trimmedStart,
        restString: undefined
    }

    if (spaceIndex === -1 && enterIndex > -1) {
        const firstString = trimmedStart.substring(0, enterIndex)
        const restString = trimmedStart.substring(enterIndex)
        return { firstString, restString }
    }

    if (spaceIndex > -1 && enterIndex === -1) {
        const firstString = trimmedStart.substring(0, spaceIndex)
        const restString = trimmedStart.substring(spaceIndex)
        return { firstString, restString }
    }

    const min = Math.min(spaceIndex, enterIndex)
    const firstString = trimmedStart.substring(0, min)
    const restString = trimmedStart.substring(min)
    return { firstString, restString }
}

/**
 * fungsi buat normalize timestamp, ya baileys kadang return object long jir, jadi musti di normalize kan
 * fungsi ini return undefined kalau param nya ngaco
 * @param {Long|number|undefined} param objek long
 * @returns {number|undefined} 
 */
export const longNormalizer = (param) => {

    if (typeof (param?.toInt) === "function") {
        return param?.toInt()
    } else if (typeof (param) === "number") {
        return param
    } else {
        return undefined
    }
}

export const toJsObject = (input) => ({ ...input })

/**
 * 
 * @param {Array} arr 
 * @returns {any|undefined}
 */
export const getOneRandomElemenFrom = arr => {
    if (!Array.isArray(arr)) return undefined
    return arr[Math.floor(Math.random() * arr.length)]
}

export const humanTimeFromSecond = (second) => {
    if (!second) return undefined
    return formatter.format(second * 1000)
}

const formatter = Intl.DateTimeFormat("id-ID", {
    timeZone: config.TIME_ZONE,
    timeZoneName: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
})