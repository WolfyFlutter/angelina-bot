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
        //console.error(error)
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