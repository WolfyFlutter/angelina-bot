import { loadJson, saveJson, allPath, loadJsonFallbackSync } from "./helper.js"
import { pluginManager } from '../index.js'

class PrefixManager {
    isEnable = null
    prefixList = []

    constructor() {
        const pDefault = {
            "isEnable": false,
            "prefixList": [
                "/",
                "❄️"
            ]
        }
        const json = loadJsonFallbackSync(allPath.prefix, pDefault)
        this.isEnable = json.isEnable
        this.prefixList = json.prefixList
    }

    enable(boolean) {
        if (typeof (boolean) !== "boolean") throw Error('param harus boolean true/false')
        if (this.isEnable === boolean) return false
        this.isEnable = boolean
        this.save()
        return true
    }

    add(prefix) {
        for (let i = 0; i < this.prefixList.length; i++) {
            if (this.prefixList[i] === prefix) return false
        }
        this.prefixList.push(prefix)
        this.save()
        return true
    }

    getInfo() {
        return {
            isEnable: this.isEnable,
            prefixList: this.prefixList
        }
    }

    delete(prefixOrIndex) {
        if (this.prefixList.length <= 1) return false
        for (let i = 0; i < this.prefixList.length; i++) {
            if (this.prefixList[i] === prefixOrIndex) {
                this.prefixList.splice(i, 1)
                this.save()
                return true
            }
        }

        let validNumber = parseInt(prefixOrIndex)
        if (isNaN(validNumber)) return false
        validNumber--
        if (validNumber < 0 || validNumber >= this.prefixList.length) return false
        this.prefixList.splice(validNumber, 1)
        this.save()
        return true
    }

    async save() {
        const json = { isEnable: this.isEnable, prefixList: Array.from(this.prefixList) }
        saveJson(json, allPath.prefix)

        //update menu
        //pluginManager.prefix = this.prefixList[0]
        pluginManager.buildMenu()
    }

    isMatchPrefix(text) {

        //if (typeof (text) !== "string") return { valid, prefix }
        if (!this.isEnable) return { valid: true, prefix: undefined }
        let prefix = this.prefixList.find(p => text.trim().startsWith(p))
        return prefix ? { valid: true, prefix } : { valid: false, prefix }
    }
}

export default PrefixManager