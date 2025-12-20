import { fileURLToPath } from 'node:url'
import allPath from "../all-path.js"

export function pluginHelpSerialize(handler) {
    const emptyPlaceholder = '(tidak ada)'
    const notFound = '-'
    const header = `*📖 dokumentasi plugin*\n\n`
    const name = `*name*\n${handler.pluginName}\n\n`
    const category = `*category*\n${handler.category.join(', ') || emptyPlaceholder}\n\n`
    const command = `*command*\n${handler.command.join(', ')}\n\n`

    const needPrefix = `*bypass prefix*\n${handler?.config?.bypassPrefix ? 'yes' : 'no'}\n\n`
    const desc = `*description*\n${handler.description || emptyPlaceholder}\n\n`
    const version = `*version*\n${handler.meta?.version || notFound}\n\n`
    const author = `*author ✨*\n${handler.meta?.author || notFound}\n\n`
    const note = `*author's note*\n${handler.meta?.note || notFound}\n\n`
    const dir = `*lokasi file*\n./${fileURLToPath(handler.dir).replace(allPath.root, '').replaceAll('\\', '/')}`
    return header + name + desc + command + category  + needPrefix  + version + author + note + dir
}