import fs from "node:fs"
import { jidDecode, areJidsSameUser } from "baileys"

// [TYPE]
/**
 * @import {PluginCtx, Plugin} "../types/types.js"
 */

/**
 * @typedef {object} userParams
 * @property {number | undefined} userAction pakai enum yang udah ada ya
 * @property {string | undefined} userCommand
 * @property {string | undefined} userAdditionalParam
 */

// [ENUM]
const Action = {
    GET: 1,
    UNINSTALL: 2,
    INSTALL: 3,
    INSTALL_FORCE: 4,

    VIEW_PLUGIN_PROTECTED: 11
}

const actionMapping = {
    "get": Action.GET,
    "g": Action.GET,

    "uninstall": Action.UNINSTALL,
    "u": Action.UNINSTALL,

    "install": Action.INSTALL,
    "i": Action.INSTALL,

    "install-force": Action.INSTALL_FORCE,

    "protected": Action.VIEW_PLUGIN_PROTECTED
}

/**
 * fungsi buat handle operasi plugin get
 * @param {PluginCtx} ctx 
 * @param {userParams} userParams
 * @returns {Promise <void>}
 */
const getPluginHandler = async (ctx, userParams) => {
    const { sock, jid, pluginManager, m, q } = ctx
    const { userCommand, userAdditionalParam } = userParams

    if (!userCommand) return await m.reply(`masukkan command plugin.`)

    const plugin = pluginManager.getPlugin(userCommand)
    if (!plugin) return await m.reply(`👻 wakwau.. kamu gak punya plugin dengan command *${userCommand}*`)

    // send as text
    if (userAdditionalParam === "-t") {
        const pluginCode = await fs.promises.readFile(plugin.path, { encoding: 'utf-8' })
        return await sock.sendMessage(jid, {
            text: pluginCode
        }, {
            quoted: q
        })
    }

    // send as js file
    else {
        let mentions = []
        let caption = `nih plugin *${plugin.name}* nya.\nplugin di buat oleh ${plugin.meta.author || '(author kosong)'}`

        if (q && !areJidsSameUser(m.sender, q?.sender)) {
            caption = `kamu di berikan plugin *${plugin.name}* oleh @${jidDecode(m.sender).user}.\nHappy coding! (⁠◕⁠ᴗ⁠◕⁠✿⁠)`
            mentions[0] = m.sender
        }

        return await sock.sendMessage(jid, {
            document: { url: plugin.path },
            fileName: plugin.meta.fileName,
            mimetype: 'text/javascript',
            caption: caption,
            mentions
        }, { quoted: q })
    }
}

// HARI INI KITA LANJUT LAGI BUAT KODINGAN UNISTALL PLUGIN YA GES :V
/**
 * fungsi buat handle operasi plugin get
 * @param {PluginCtx} ctx 
 * @param {userParams} userParams
 * @returns {Promise <void>}
 */
const uninstallPluginHandler = async (ctx, userParams) => {
    const { pluginManager, m } = ctx
    const { userCommand } = userParams
    const result = await pluginManager.deletePlugin(userCommand)
    ctx.menuManager.buildMenu()
    return await m.reply(result.message || `no message`)
}

/**
 * fungsi buat handle operasi plugin get
 * @param {PluginCtx} ctx 
 * @param {userParams} userParams
 * @returns {Promise <void>}
 */
const pluginInstallHandler = async (ctx, userParams) => {
    const { m, q, pluginManager, menuManager } = ctx
    const isReplacePlugin = userParams.userCommand === "-r"

    if (!q) return await m.reply(`reply ke pesan dokumen file js atau pesan yang berisi kode plugin`)

    if (q.content === "documentMessage") {
        const isValidMime = q?.message?.documentMessage?.mimetype === "text/javascript"
        if (!isValidMime) return await m.reply(`mime nya invalid`)
        const buffer = await q.download("buffer")
        const response = await pluginManager.install(buffer, isReplacePlugin)
        const { ok, message } = response
        if (ok) menuManager.buildMenu()
        return await m.reply(message)
    } else if (q.content === "conversation") {
        const buffer = Buffer.from(q.text)
        const response = await pluginManager.install(buffer, isReplacePlugin)
        const { ok, message } = response
        if (ok) menuManager.buildMenu()
        return await m.reply(message)
    } else {
        return await m.reply("reply yang bener kocak")
    }



    //return await m.reply("install plugin " + (isReplacePlugin ? "replace plugin" : "install vanilla"))
}

// kode nya dikit, 

/**@param { PluginCtx } ctx */
async function run(ctx) {
    const { text, sock, jid, m, pluginManager } = ctx
    if (!text) return m.reply('welcome plugin manager. capek jelasin')

    const param = text.split(/\s+/).filter(Boolean)

    const userActionString = param[0]
    const userAction = actionMapping[userActionString]
    /**@type {userParams} */
    const userParams = {
        userAction,
        userCommand: param[1],
        userAdditionalParam: param[2]
    }
    if (userAction === Action.GET) {
        await getPluginHandler(ctx, userParams)
    }

    else if (userAction === Action.UNINSTALL) {
        await uninstallPluginHandler(ctx, userParams)
    }

    else if (userAction === Action.INSTALL) {
        await pluginInstallHandler(ctx, userParams)
    }

    else if (userAction === Action.VIEW_PLUGIN_PROTECTED) {
        const header = `berikut adalah list plugin protected\n\n`
        const result = pluginManager.getProtectedPluginString()
        await m.reply(header + result)
    }

    else {
        await m.reply('aksi invalid. gunakan -h untuk bantuan')
    }
}

const description = `adalah plugin untuk manage plugin :v
berikut cara pakai nya

\`plugin -i [-r]\` 
buat install plugin, wajib reply ke message. param *-r* dipakai untuk replae install kalau semisal ada plugin yang bentrok.

\`plugin -u <cmd>\`
buat hapus plugin. bisa juga pakai *--uninstall*

\`plugin -g <cmd> [-t]\`
buat dapetin plugin, *-g* juga bisa di ganti pakai *--get*.
opsi *-t* adalah kirim plugin sebagai teks. opsional.

\`plugin --protected\`
buat liat list plugin protected`

/**@type {Plugin} */
const plugin = {
    run,
    name: "plugin manager",
    commands: ["plugin"],
    categories: ["core"],
}

plugin.description = `adalah plugin untuk manage plugin :v
berikut cara pakai nya

\`plugin i [-r]\` 
buat install plugin, wajib reply ke message. param *-r* dipakai untuk replae install kalau semisal ada plugin yang bentrok.

\`plugin u <cmd>\`
buat hapus plugin. bisa juga pakai *uninstall*

\`plugin g <cmd> [-t]\`
buat dapetin plugin, *-g* juga bisa di ganti pakai *get*.
opsi *-t* adalah kirim plugin sebagai teks. opsional.

\`plugin protected\`
buat liat list plugin protected`

plugin.meta = {
    fileName: "core-plugin-manager.js",
    author: "wolep",
    note: "restart kalau udh kebanyakan install / uninstall plugin ya.",
    version: "1"
}

plugin.config = {
    protected: true
}

export default plugin