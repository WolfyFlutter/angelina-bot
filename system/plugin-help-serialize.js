import { botInfo as b, dirPovCwd } from './helper.js'

export function pluginHelpSerialize(handler) {
    const emptyPlaceholder = '(tidak ada)'
    const notFound = '-'
    const header = `*📖 dokumentasi plugin*\n\n`
    const name = `${b.b3f}name${b.b3b}\n${handler.pluginName}\n\n`
    const category = `${b.b3f}category${b.b3b}\n${handler.category.join(', ') || emptyPlaceholder}\n\n`
    const command = `${b.b3f}command${b.b3b}\n${handler.command.join(', ')}\n\n`

    const needPrefix = `${b.b3f}bypass prefix${b.b3b}\n${handler?.config?.bypassPrefix ? 'yes' : 'no'}\n\n`
    const desc = `${b.b3f}description${b.b3b}\n${handler.description || emptyPlaceholder}\n\n`
    const version = `${b.b3f}version${b.b3b}\n${handler.meta?.version || notFound}\n\n`
    const fileName = `${b.b3f}meta file name${b.b3b}\n${handler.meta?.fileName || notFound}\n\n`
    const author = `${b.b3f}author ✨${b.b3b}\n${handler.meta?.author || notFound}\n\n`
    const note = `${b.b3f}author's note${b.b3b}\n${handler.meta?.note || notFound}\n\n`
    const dir = `${b.b3f}lokasi file${b.b3b}\n${dirPovCwd(handler.dir)}`
    return header + name + desc + category + command + needPrefix + author + note + fileName + version + dir
}