import fs from 'node:fs'

export function vString(inputString, paramName = "param") {
    if (typeof (inputString) !== 'string' || !inputString.trim()) {
        throw Error(`${paramName} harus string dan gak boleh kosong.`)
    }
}

export function getErrorLine(errorStack) {
    return errorStack.match(/t=\d+:(\d+):/)?.[1]
}

export async function safeRun(fn, ...params) {
    try {
        const result = await fn(...params)
        return { ok: true, data: result }
    } catch (error) {
        console.error('[safeRun]', error)
        return { ok: false, data: error.message }
    }
}

export function safeRunSync(fn, ...params) {
    try {
        const result = fn(...params)
        return { ok: true, data: result }
    } catch (error) {
        console.error('[safeRunSync]', error)
        return { ok: false, data: error.message }
    }
}

export function pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)]
}

export function loadJson(path) {
    const jsonString = fs.readFileSync(path)
    console.log(`📤 load json: ${path}`)
    return JSON.parse(jsonString)
}

export function saveJson(json, path) {
    const jsonString = JSON.stringify(json, null, 2)
    fs.writeFileSync(path, jsonString)
    console.log(`💾 save json: ${path}`)
}

export function extractUrl(string) {
    const match = string.match(/https?:\/\/[^\s'`\\]+/g)
    const urls = []

    for (let i = 0; i < match?.length; i++) {
        const r = safeRunSync((u) => new URL(u), match[i])
        if (r.ok) urls.push(match[i])
    }

    return urls
}

export function msToReadableTime(ms) {

    if (isNaN(parseInt(ms))) return 'invalid ms value'

    let d = 0, h = 0, m = 0, s = 0
    const satuHari = 1000 * 60 * 60 * 24
    const satuJam = 1000 * 60 * 60
    const satuMenit = 1000 * 60
    const satuDetik = 1000

    while (ms >= satuHari) {
        d++
        ms -= satuHari
    }
    while (ms >= satuJam) {
        h++
        ms -= satuJam
    }
    while (ms >= satuMenit) {
        m++
        ms -= satuMenit
    }
    while (ms >= satuDetik) {
        s++
        ms -= satuDetik
    }
    d = d ? d + ' hari ' : ''
    h = h ? h + ' jam ' : ''
    m = m ? m + ' menit ' : ''
    s = s ? s + ' detik ' : ''
    let result = d + h + m + s
    if (!result) result = '< 1 detik'
    return result.trim()
}

export function formatByte(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    if (!Number.isFinite(bytes)) return 'Invalid';

    const k = 1024; // dasar binary
    const dm = decimals < 0 ? 0 : decimals;

    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}