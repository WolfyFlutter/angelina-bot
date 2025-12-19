import { fileURLToPath } from 'node:url'
import allPath from "../all-path.js"

export function pluginHelpSerialize(handler) {
    const emptyPlaceholder = '(tidak ada)'
    const notFound = 'unknown'
    const header = `*📖 dokumentasi plugin*\n\n`
    const name = `*name* ${handler.pluginName}\n\n`
    const category = `*category* ${handler.category.join(', ') || emptyPlaceholder}\n\n`
    const command = `*command* ${handler.command.join(', ')}\n\n`
    const needPrefix = `*bypass prefix* ${handler?.config?.bypassPrefix ? 'yes' : 'no'}\n\n`
    const desc = `*description*\n${handler.help || emptyPlaceholder}\n\n`
    const version = `version: ${handler.meta?.version || notFound}\n`
    const author = `author: ${handler.meta?.author || notFound}\n`
    const note = `note: ${handler.meta?.note || notFound}\n`
    const dir = `*lokasi file* ./${fileURLToPath(handler.dir).replace(allPath.root,'').replaceAll('\\','/')}`
    return header + name + desc + command + category + needPrefix + version + author + note + dir
}