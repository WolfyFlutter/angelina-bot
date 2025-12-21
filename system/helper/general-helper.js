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