
/**
 * @param {import('../../system/types/plugin').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {
    // hit api
    const r = await fetch('https://api.thecatapi.com/v1/images/search')
    const j = await r.json()
    const catImageUrl = j[0].url
    return await sock.sendMessage(jid, {
        image: { url: catImageUrl },
        caption: 'miaw'
    }, {
        quoted: m
    })
}

handler.pluginName = 'cat'
handler.description = 'get random cat image'
handler.command = ['kucings']
handler.category = ['example']

handler.meta = {
    fileName: 'kucing.js',
    version: '1',
    author: 'wolep',
    note: 'kucing kucing',
}
export default handler