import path from "node:path"

const currentDir = (p) => path.join(import.meta.dirname, p)

export const allPaths = {
    // dir
    baileysAuth : currentDir('../auth'),
    plugins: currentDir('/plugins'),
    pluginTemp: currentDir('/plugin-karantina'),
    temp: currentDir('../temp'),
    media: currentDir('/media'),

    // file
    prefixConfig : currentDir('../data/prefix-config.json'),
    themeConfig : currentDir ('../data/theme-config.json'),
    fetchAllParticipant : currentDir('../data/fetch-all-participant.json'),
    database : currentDir('../data/database.db')

}
