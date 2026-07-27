/**
 * @import {PluginVerifikatorResponse, Plugin} from "./types/types.js"
 */

import { pluginManager } from "./manager/plugin-manager.js"

/**
 * fungsi yang memvalidasi array,
 * akan return true jika type array, semua elemen harus string dan gak boleh "" empty string
 * false otherwise
 * @param {string[]} commandsArray 
 * @returns {Boolean}
 */
const isValidArray = (commandsArray) => {
    if (!Array.isArray(commandsArray)) return false
    if (commandsArray.length === 0) return false
    const allStringAndNoEmpty = commandsArray
        .every(cmd => typeof cmd === "string" && cmd !== "")
    return allStringAndNoEmpty
}

/**@type {PluginVerifikatorResponse} */
const fail = message => ({
    status: "fail",
    message
})

/**@type {PluginVerifikatorResponse} */
const success = message => ({
    message,
    status: "install"
})

/**@type {PluginVerifikatorResponse} */
const replace = message => ({
    message,
    status: "replace"
})


/**
 * 
 * @param {*} module 
 * @param {Boolean} isModuleReplace 
 * @returns {PluginVerifikatorResponse}
 */
const pluginVerifikator = (module, isModuleReplace) => {
    try {
        // cek input falsy
        if (!module) return fail(`input apa tu`)

        /// cek apakah plugin punya export default
        if (!module?.default) return fail(`plugin gak punya export default`)

        /**@type {Plugin} */
        const newPlugin = module.default
        const { run, name, commands, categories, description, meta } = newPlugin
        const AsyncFunction = (async () => { }).constructor;

        // KEY CHECK
        const keys = ["run", "name", "commands", "categories", "description", "meta"]
        for (const key of keys) {
            if (!Object.hasOwn(newPlugin ?? {}, key)) return fail(`structure error: gak ada key ${key}`)
        }

        // KEY CHECK META
        const keysMeta = ["author", "fileName", "note", "version"]
        for (const key of keysMeta) {
            if (!Object.hasOwn(newPlugin?.meta ?? {}, key)) return fail(`structure error: gak ada key meta.${key}`)
        }

        // KEY TYPE CHECK
        if ((run?.constructor?.name !== "AsyncFunction")) return fail(`structure error. gak ada *plugin.run* atau bukan merupakan async function`)
        if (!name) return fail(`value error. *plugin.name* gak boleh falsy`)
        if (!isValidArray(commands)) return fail(`type and value error : plugin.commands harus array dan gak boleh kosong atau berisi emptry string`)
        if (!isValidArray(categories)) return fail(`type and value error : plugin.categories harus array dan gak boleh kosong atau berisi emptry string`)

        if (!newPlugin?.meta?.fileName) return fail(`*value error. plugin.meta.fileName* gak boleh falsy`)

        // file name check
        const oldPluginWillReplace = pluginManager.pluginArray
            .find(plugin => plugin?.meta?.fileName === newPlugin?.meta?.fileName)

        if (oldPluginWillReplace?.config?.protected) return fail(`plugin yang ingin kamu install memiliki fileame yang sama dengan plugin ${oldPluginWillReplace.name}. dan itu protected.`)

        // for (const cmd of newPlugin.commands) {
        //     const pluginProtected = pluginManager.pluginMap.get(cmd)
        //     const bentrok = pluginProtected?.config?.protected
        //     if (bentrok) return fail(`command plugin baru mu *${cmd}* bentrok dengan protected plugin *${pluginProtected.name}*`)
        // }

        const commandBentrok = []
        for (const cmd of newPlugin.commands) {
            const pluginBentrok = pluginManager.pluginMap.get(cmd)
            const bentrok = (pluginBentrok?.meta?.fileName !== newPlugin?.meta?.fileName) && pluginBentrok
            if (bentrok) commandBentrok.push(`${cmd} -> ${pluginBentrok?.name}`)
        }
        if (commandBentrok.length > 0) {
            const header = `ada command bentrok\n\n`
            const body = commandBentrok.join('\n') + '\n\n'
            const footer = `ganti command tersebut dengan yang lain ya.`
            const kataKata = header + body + footer
            return fail(kataKata)
        }

        if (oldPluginWillReplace) {
            const commandGone = oldPluginWillReplace.commands
                .filter(oldCmd => !newPlugin.commands
                    .some(newCmd => newCmd === oldCmd))

            const commandNew = newPlugin.commands
                .filter(newCmd => !oldPluginWillReplace.commands
                    .some(oldCmd => oldCmd === newCmd)
                ).map(v => `${v} - ✨`)

            const displayDiffCommandOldAndNew = oldPluginWillReplace.commands
                .map(oldCmd => ({
                    cmd: oldCmd,
                    gone: commandGone.some(v => v === oldCmd)
                })).sort((a, b) => a.gone - b.gone).map(v => `${v.cmd} - ${(v.gone ? '🗑️' : '[stay]')}`)

            const combine = [...commandNew, ...displayDiffCommandOldAndNew].join('\n')

            if (isModuleReplace) {
                const kataKata = `plugin ${oldPluginWillReplace.name} berhasil di replace
berikut mutasi command nya

${combine}

enjoy your new plugin`
                return replace(kataKata)
            } else {
                const kataKata = `woit.. kamu akan me replace plugin *${oldPluginWillReplace.name}* dengan plugin baru. ulangi command mu dengan menambahkan flag -r untuk replace`
                return fail(kataKata)
            }
        }
        const kataKata = `plugin berhasil di install!

nama plugin: ${newPlugin.name}
command : ${newPlugin.commands.sort().map(cmd => "[" + cmd + "]").join(" ")}
category : ${newPlugin.categories.sort().map(cmd => "[" + cmd + "]").join(" ")}

description
${newPlugin.description}

author: ${newPlugin.meta.author || '-'}
author's note : ${newPlugin.meta.note || '-'}

version: ${newPlugin.meta.version || '-'}`

        return success(kataKata)
    } catch (e) {
        console.error(e)
        return fail(e.message)
    }
}

export { pluginVerifikator }