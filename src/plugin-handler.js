import fs from 'fs'
import path from 'path'
import { allPath } from './static.js'
import { Category } from './helper.js'
import { prefixManager } from '../index.js'

const pluginsNoPrefix = new Map()
const plugins = new Map()
const pluginsFilaName = []

// menu value
const category = new Map()
Object.values(Category).forEach(c => category.set(c, []))

let menuText = ''
let categoryText = Object.values(Category).map(c => '🔖 ' + c).join("\n")

async function loadPlugins() {
  // clear dulu variabel nya
  pluginsNoPrefix.clear()
  plugins.clear()
  pluginsFilaName.length = 0
  Object.values(Category).forEach(c => category.get(c).length = 0)

  await readPlugins(allPath.pluginNoPrefix)
  await readPlugins(allPath.plugins)
  menuText = [...category.entries()].map(x => '🔖 *' + x[0] + '*' + '\n' + x[1].map(x => '	» ' + x).join('\n')).join('\n\n')
}

async function readPlugins(folderPath) {
  const fileNames = fs.readdirSync(folderPath)
  const dateNow = Date.now()


  for (let i = 0; i < fileNames.length; i++) {
    const fileName = fileNames[i]
    const fullPath = path.join(folderPath, fileName)
    const stat = fs.statSync(fullPath)

    if (!stat.isFile()) continue
    if (!fileName.endsWith('.js')) continue
    pluginsFilaName.push(fileName)


    const pluginModule = await import(`file://${path.resolve(fullPath)}?t=${dateNow}`)
    const handler = pluginModule.default
    if (typeof (handler) !== 'function') continue

    handler.dir = folderPath + '/' + fileName

    if (handler.bypassPrefix) {
      const farm = []
      handler.command.forEach(command => {
        pluginsNoPrefix.set(command, handler)
        farm.push(command)

      })
      handler.alias.forEach(alias => {
        pluginsNoPrefix.set(alias, handler)
        farm.push(alias)

      })

      const text = farm.join(', ')
      handler.category.forEach(c => {
        category.get(c).push(text)
      })
    } else {
      const farm = []
      const p = prefixManager.getInfo().isEnable ? prefixManager.getInfo().prefixList[0] : ''
      handler.command.forEach(command => {
        plugins.set(command, handler)
        farm.push(p  + command)

      })
      handler.alias.forEach(alias => {
        plugins.set(alias, handler)
        farm.push(p  + alias)

      })

      const text = farm.join(', ')
      handler.category.forEach(c => {
        category.get(c).push(text)
      })
    }
  }
  //console.log(structuredClone(category))

}

// gak tau :v
(async () => await loadPlugins())()

function renderMenu(prefix) {

}

export { plugins, pluginsNoPrefix, loadPlugins, category, menuText, categoryText , pluginsFilaName}
