/**
 * @import {PluginCtx, Plugin, PrefixStatus} from "../types/types.js"
 * @typedef {"--status" | "-s" | "--on" | "--off" | "--add" | "-a" |"--delete" | "-d" | "--set-to-default-list" | "--reserved"} subCommand
 */


/**
 * fungsi yang mengembalikan string buat di kirim ke chat
 * @param {PrefixStatus} prefixStatus 
 * @returns {string}
 */
const parsePrefixStatus = (prefixStatus) => {
    const { isPrefixActive, prefixList } = prefixStatus
    const statusText = `prefix : ` + (isPrefixActive ? 'on' : 'off')
    const prefixListText = `prefix list` + '\n'
        + prefixList
            .map((v, i) => `${i + 1}. [${v}]`)
            .join("\n")

    const finalText =
        statusText + '\n\n' +
        prefixListText

    return finalText
}

/**
 * 
 * @param {PluginCtx} ctx 
 * @returns {Promise <void>}
 */

async function run(ctx) {
    const { sock, text, m, prefixManager, pluginManager } = ctx

    // kalau text kosong sambut aja langsung welcome!
    if (!text) return await m.reply("welcome to prefix manager!")

    // teks berisi string | --subcommand bla bla bla  | kita trim dulu, trim start aja
    const textTrimmedStart = text.trimStart()

    // kita perlu dapatkan --subcommand nya , pakai substring
    const _indexSpasi = textTrimmedStart.indexOf(" ")
    /**@type {subCommand} */
    const subCommand = textTrimmedStart
        .substring(0, _indexSpasi === -1 ? textTrimmedStart.length : _indexSpasi)

    //dan sisakan | bla bla bla nya  | 
    const restText = textTrimmedStart.substring(subCommand.length)

    if (subCommand === "--status" || subCommand === "-s") {
        const content = parsePrefixStatus(prefixManager.getStatus())
        return await m.reply(content)
    }

    else if (subCommand === "--on") {
        const response = await prefixManager.togglePrefixOn()
        await m.reply(response.message)
    }

    else if (subCommand === "--off") {
        const response = await prefixManager.togglePrefixOff()
        await m.reply(response.message)
    }

    else if (subCommand === "--add" || subCommand === "-a") {
        const response = await prefixManager.addPrefix(restText.trim())
        await m.reply(response.message)
    }

    else if (subCommand === "--set-to-default-list") {
        const response = await prefixManager.setToDefaultPrefixList()
        await m.reply(response.message)
    }

    else if (subCommand === "--delete" || subCommand === "-d") {
        const response = await prefixManager.deletePrefix(restText.trim())
        await m.reply(response.message)
    }

    else if (subCommand === "--reserved") {
        const header = `berikut adalah reserved prefix dan nama plugin nya`
        const content = pluginManager.getBypassPluginString()
        const footer = `jangan gunakan prefix itu ya`
        const print = `${header}\n\n${content}\n\n${footer}`
        await m.reply(print)
    }

    else {
        await m.reply("action invalid, baca doc dulu sana... gunakan `-h`")
    }

}

/**@type {Plugin} */
const plugin = { run,
    name: "prefix manager",
    commands: ["prefix"],
    categories: ["core"],
 }

plugin.description = `plugin ini buat manage prefix

cara pakai

\`prefix --status\`
buat liat status prefix. bisa di singkat jadi *-s*

\`prefix --off\`
buat matiin prefix.

\`prefix --on\`
buat hidupin prefix.

\`prefix --add <prefix_mu>\`
buat nambah prefix baru. contoh pakai nya *prefix --add #*. pastikan prefix baru mu gak bentrok dengan command plugin yang bypass prefix.
untuk liat command yang bypass prefix, kamu bisa gunakan comand *prefix --reserved*

\`prefix --delete <index>\`
buat hapus prefix, hapus nya pakai index.
contoh *prefix -d 1*. *--delete* bisa juga di ganti dengan *-d*

\`prefix --set-to-default-list\`
buat hapus semua prefix dan set list nya ke default.

\`prefix --reserved\`
buat liat list list prefix yang reserved.`

plugin.meta = {
    fileName: "core-prefix-manager.js",
    author: "wolep",
    note: "prefix --off adalah sebuah kenikmatan",
    version: "1",
}

plugin.config = {
    protected: true,
    bypassPrefix: true,
}

export default plugin