import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { botInfo } from './bot-info.js'
import { prefixManager } from './helper.js'

export default class PluginManager {
    categoryArray = []
    mapCatWithCmdArray = new Map()
    plugins = new Map()
    forMenu = {
        menuText: '',
        menuAllText: '',
        category: new Map()
    }

    buildMenu() {
        console.log('menu build')
        this.forMenu.category.clear()
        this.forMenu.menuAllText = ''
        this.forMenu.menuText = ''

        this.mapCatWithCmdArray.clear()

        const prefix = prefixManager.getInfo()

        const pa = Array.from(this.plugins)

        // prefix command (for random display bottom help)
        pa.forEach((p,i,plug) => {
            const catArr = p[1].category
            catArr.forEach(cat => {
                if (!this.mapCatWithCmdArray.get(cat)) this.mapCatWithCmdArray.set(cat, [])
                this.mapCatWithCmdArray.get(cat).push({cmd: p[0], plugin: plug[i]})
            })

        })

        // category list packed in array, (for bottom random category output and menu output)
        this.categoryArray = Array.from(this.mapCatWithCmdArray.keys()).sort()


        // [menu render]
        // main menu (nampilin caregory only)
        this.forMenu.menuText = this.categoryArray.map(c => `${botInfo.b1f}${c}${botInfo.b1b}`).join('\n')

        // menu category (map, nampilin command append by category)
        const ar = Array.from(this.mapCatWithCmdArray.entries())
            .map(v => [v[0], `${botInfo.b1f}${v[0]}${botInfo.b1b}\n${v[1]
                .map(obj => {
                    const p = obj.plugin[1].config?.bypassPrefix ? '' :
                    prefix.isEnable ? prefix.prefixList[0] : ''
                    return `${botInfo.b2f}${p}${obj.cmd}  _${obj.plugin[1].pluginName}_${botInfo.b2b}`
                }).sort()
                .join('\n')}`])
        ar.forEach(v => this.forMenu.category.set(v[0], v[1]))

        // menu all (display all category and menu)
        this.forMenu.menuAllText = ar.map(v => v[1]).join('\n\n')
    }

    async loadPlugins() {
        console.log('laod plugin')
        const cd = import.meta.dirname
        this.plugins.clear()

        // plugin path
        const allPluginPath = [
            path.join(cd, 'plugins'), //system plugin
            path.join(cd, '../user/plugins'), //your plugin
        ]
        for (let i = 0; i < allPluginPath.length; i++) {
            await this.processAllPluginsFromDir(allPluginPath[i])
        }
    }

    async processAllPluginsFromDir(folderPath) {
        let files = []
        try {
            files = await fs.promises.readdir(folderPath)
        } catch (error) {
            console.error(`❌ gagal membaca folder pada path berikut\n${folderPath}`)
            return
        }

        // filter files only keep files that end with .js
        files = files.filter(f => f.endsWith('.js'))
        for (let i = 0; i < files.length; i++) {
            const filePath = path.join(folderPath, files[i])
            const fileUrl = pathToFileURL(filePath).href + `?t=${Date.now()}`

            try {
                const module = await import(fileUrl)
                const inspect = this.verifyModule(module)
                if (!inspect.ok) throw Error(inspect.reason)

                const handler = module.default
                const command = handler.command
                for (let i = 0; i < command.length; i++) {
                    const sameCommand = this.plugins.get(command[i])
                    if (sameCommand) throw Error(`plugin ini memiliki command yang sama dengan ${sameCommand.pluginName} yaitu command ${command[i]}`)
                }

                handler.dir = fileUrl

                // add to map also handle multiple command
                command.forEach(cmd => {
                    this.plugins.set(cmd, handler)
                })

                console.log(`[ OK ] ${removeBust(filePath)}`)
            } catch (e) {
                console.error(`[FAIL] ${removeBust(filePath)}\nstack: ${e.stack}\n`)
            }
        }
    }

    verifyModule(module) {
        const error = reason => ({ ok: false, reason })
        const sucess = reason => ({ ok: true, reason })
        const arrayNotEmpty = array => Array.isArray(array) && Boolean(array?.length)
        const singleWord = string => /^[^\s]+$/g.test(string)
        const stringNotEmpty = string => typeof string === "string" && string.length && (!string.startsWith(' ') && !string.endsWith(' '))

        // export default check
        if (typeof (module?.default) !== 'function') return error('modul bukan jenis export default')

        // plugin name check
        const { pluginName, command, category } = module.default
        if (!stringNotEmpty(pluginName)) return error('handler.pluginName nya invalid. musti string, depan belakang gak boleh ada spasi')

        // command checking
        if (!arrayNotEmpty(command)) return error(`handler.command must an array. at least have 1 element and no space`)
        for (let i = 0; i < command?.length; i++) {
            if (!singleWord(command[i])) return error(`handler.command array has invalid command: ${command[i]}. must not containt any whitespace`)
        }

        // category checking
        if (!arrayNotEmpty(category)) return error(`handler.category invalid`)

        return sucess('no error')
    }
}

const removeBust = s => s.split('?')[0]