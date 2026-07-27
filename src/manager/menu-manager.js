/**
 * @import {WAMessageContent} from "baileys"
 */

/**
 * @import { Plugin } from "../types/types.js"
 */

/**
 * @typedef {object} MenuCategoryContent
 * @property {string[]} textArray
 * @property {string[]} commandArray
 * @property {string} finalText
 */

import { pluginManager } from "../manager/plugin-manager.js"

class MenuManager {
    // build menu
    /**@type {Map<string, MenuCategoryContent>} */
    categoryMap = new Map()
    categoryArray = []
    categoryText = undefined
    allMenuText = undefined

    /**@type {{message: WAMessageContent}} */
    config = {
        message : '',
        title : 'bot',
        url : 'https://www.google.com',
        description : ''
    }


    /**
     * 
     * @param { typeof pluginManager.pluginArray } pluginArray 
     */
    buildMenu(pluginArray) {
        this.buildMenu2(pluginManager.pluginArray)
        console.log(`menu built`)
    }


    /**
     * 
     * @param { Plugin [] } pluginArray 
     */
    buildMenu2(pluginArray) {

        // CLEAN UP
        this.categoryMap.clear()
        this.categoryArray.length = 0
        this.categoryText = undefined
        this.allMenuText = undefined

        // MERGE COMMANDS FROM PLUGIN ARRAY
        const pluginRowNormalize = pluginArray.map(plugin => {
            const commandJoin = plugin.commands.sort().join(', ')
            return {
                pluginRow: `- ${commandJoin} (${plugin.name})`, // dekor disini
                plugin: plugin
            }
        }).sort((a, b) => a.pluginRow.localeCompare(b.pluginRow))


        // BUILDING this.categoryMap
        pluginRowNormalize.forEach(v => {
            const { pluginRow, plugin } = v
            for (const category of plugin.categories) {
                const categoryExist = this.categoryMap.get(category)
                if (!categoryExist) this.categoryMap.set(category, {
                    textArray: [],
                    commandArray: [],
                    finalText: undefined,
                })
                const currentCategory = this.categoryMap.get(category)
                currentCategory.textArray.push(pluginRow)
                plugin.commands.forEach(cmd => currentCategory.commandArray.push(cmd))
            }
        })

        // BUILDING this.categoryArray
        this.categoryArray = Array.from(this.categoryMap.keys()).sort()

        // BUILDING this.categoryText [for command menu only]
        this.categoryText = this.categoryArray.map(v => `- ${v}`).join('\n') // dekor disini

        // UPDATING this.categoryMap.get(?).finalText [for command menu <category>]
        this.categoryArray.forEach(category => {
            const printCategory = `*${category}*\n` // dekor disini
            const pluginRows = this.categoryMap.get(category).textArray.join('\n')
            this.categoryMap.get(category).finalText = printCategory + pluginRows
        })

        // BUILDING this.allMenuText [for command menu all]
        this.allMenuText = this.categoryArray
            .map(category => this.categoryMap.get(category).finalText)
            .join('\n\n')
    }

    updateThumbnail(message) {
        this.config.message = message
    }

    updateUrl (url){
        this.config.url = url ?? ''
    }

    updateTitle (title){
        this.config.title = title ?? ''
    }

    updateDescription (description){
        this.config.description = description ?? ''
    }

    getThumbnail() {
        return this.config
    }
}

const menuManager = new MenuManager()
await menuManager.buildMenu()
export { menuManager }