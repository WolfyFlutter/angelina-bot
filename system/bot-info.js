import {saveJson, allPath, loadJsonFallbackSync } from './helper.js'

const fallback = {
  "tm": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj8Jf0AJ4g-4_jHICkPf_9EpaUHjZowQnx-WNJBPgJbuAJoZf0S8prMdhsF4EiB5PeVZ52o2y7oiTMN7NVuAkkMQzVMXKBzGt1-5eGb2oWyW4sKrVHZBrzVMd-CMdHszvH9QRCDhoeQe5qqD2AJVMQUEmISh2VjAphGLpXvoaEsOmjZT7hv7zlwIgoLTXc/s16000/angelina_thumbnail_480p.webp",
  "stm": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj8Jf0AJ4g-4_jHICkPf_9EpaUHjZowQnx-WNJBPgJbuAJoZf0S8prMdhsF4EiB5PeVZ52o2y7oiTMN7NVuAkkMQzVMXKBzGt1-5eGb2oWyW4sKrVHZBrzVMd-CMdHszvH9QRCDhoeQe5qqD2AJVMQUEmISh2VjAphGLpXvoaEsOmjZT7hv7zlwIgoLTXc/s16000/angelina_thumbnail_480p.webp",
  "dn": "/ᐠ > ˕ <マ angelina bot~ ₊˚⊹♡",
  "st": "by wolep",
  "an": "wolep",
  "b1f": " ❄️ ⌞  *",
  "b1b": "*  ⌝",
  "b2f": "   ᯓ   ",
  "b2b": "",
  "b3f": "*📄 ",
  "b3b": "*"
}
const json = loadJsonFallbackSync(allPath.botInfo, fallback)

const botInfo = {
    tm: json.tm,
    stm: json.stm,
    dn: json.dn,
    st: json.st,
    an: json.an,
    b1f: json.b1f,
    b1b: json.b1b,
    b2f: json.b2f,
    b2b: json.b2b,
    b3f: json.b3f,
    b3b: json.b3b,
}

export { botInfo }

export function updateThumbnailMenu(url) {
    botInfo.tm = url
    saveJson(botInfo, allPath.botInfo)
}

export function updateSmallThumbnailMenu(url) {
    botInfo.stm = url
    saveJson(botInfo, allPath.botInfo)
}

export function updateDisplayName(name) {
    botInfo.dn = name
    saveJson(botInfo, allPath.botInfo)
}

export function updateSecondaryText(text) {
    botInfo.st = text
    saveJson(botInfo, allPath.botInfo)
}

export function updateBulletin1(front, back) {
    botInfo.b1f = front
    botInfo.b1b = back
    saveJson(botInfo, allPath.botInfo)
}

export function updateBulletin2(front, back) {
    botInfo.b2f = front
    botInfo.b2b = back
    saveJson(botInfo, allPath.botInfo)
}

export function updateBulletin3(front, back) {
    botInfo.b3f = front
    botInfo.b3b = back
    saveJson(botInfo, allPath.botInfo)
}