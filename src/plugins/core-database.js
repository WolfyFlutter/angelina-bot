import { formatBytes } from "../helper/common.js"

/**
 * @import {PluginCtx, Plugin} from "../types/types.js"
 */

/**
 * main plugin function
 * @param {PluginCtx} ctx 
 * @returns {Promise <any>}
 */
async function run(ctx) {
    const { m } = ctx
    let map = new Map()
    _.db.prepare(`
SELECT
    sqlite_schema.type,
    sqlite_schema.tbl_name AS tableName,
    dbstat.name,
    SUM(CASE
            WHEN dbstat.pagetype='leaf'
            THEN dbstat.ncell
            ELSE 0
        END) AS entries,
    SUM(dbstat.pgsize) AS size
FROM dbstat
LEFT JOIN sqlite_schema
ON dbstat.name = sqlite_schema.name
GROUP BY dbstat.name
ORDER BY sqlite_schema.tbl_name,
         sqlite_schema.type DESC;
`).all().forEach(row => {
        const mapExist = map.has(row.tableName)
        if (!mapExist) map.set(row.tableName, [])
        const currentMap = map.get(row.tableName)
        currentMap.push(row)
    })
    const text = Array.from(map).map(v => {
        const tableName = `${v[0] ?? 'unknown'}`
        const s = v[1]
        return s.map(v => (v?.type === 'index' ? '' : v?.type === 'table' ? '📦' : '🗺️') + ' ' + v.name + '\n> ' + _.commonHelper.formatBytes(v.size) + ' | ' + v.entries + ' entries').join('\n')
    }).join('\n\n')
    

    return await m.reply(text)
}

/** @type {Plugin} */
const plugin = {
    run,
    name: "database",
    commands: ["db"],
    categories: ["core"],
    description: "cek db"
}

plugin.meta = {
    fileName: "core-database.js",
    version: "1",
    author: "wolep",
    note: "idk"
}

export default plugin