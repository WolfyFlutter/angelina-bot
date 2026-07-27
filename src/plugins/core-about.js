/*  
    kalian boleh apa apain sc nya, its up to you
    tapi kode plugin ini jangan di apa apain ya :v
    leave some for me to guide the other hehe
*/

import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { allPaths } from "../all-paths.js"

const REPO_URL = `https://github.com/WolfyFlutter/angelina-bot`
const GH_API = `https://api.github.com/repos/WolfyFlutter/angelina-bot`
const THUMBNAIL_PATH = join(allPaths?.media, 'furry-big.png')

/**
 * @import {PluginCtx, Plugin} from "../types/types.js"
 */

/**
 * @param {PluginCtx} ctx 
 * @returns {Promise <any>}
 */
async function run(ctx) {
    const { m, q, sock, jid } = ctx
    const wam = q || m

    let json = {}
    try {
        const r = await fetch(GH_API)
        json = await r.json()
    } catch (_) {
        // shhhh
    }

    const fullName = json?.full_name ?? `WolfyFlutter/angelina-bot`
    const stars = json?.stargazers_count ?? `-`
    const forks = json?.forks_count ?? `-`
    const description = json?.description ?? `awesome bot`

    return await sock.relayMessage(jid, {
        extendedTextMessage: {
            title: fullName,
            matchedText: REPO_URL,
            description: `⭐${stars}  🍴${forks}`,
            text: `${REPO_URL}
${description}

makasih ges ya yang udah cobain bot ini :v kalau kalian suka bisa kasih star dan atau fork. kalau ada masukan atau saran.. bilang aja.. jangan malu :v thankyou~`,
            jpegThumbnail: await readFile(THUMBNAIL_PATH, { encoding: 'base64' })
        }
    }, {})
}

/**@type {Plugin} */
const plugin = {
    run,
    name: "about",
    commands: ["about"],
    categories: ["core"],
    description: "buat nampilin note doang",
}

plugin.meta = {
    fileName: "core-about.js",
    author: "wolep",
    note: "auu..",
    version: "1"
}

plugin.config = {
    protected: true,
}

export default plugin