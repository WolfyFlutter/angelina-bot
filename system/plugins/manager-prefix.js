import { sendText, botInfo, textOnlyMessage, prefixManager, pluginManager,userManager } from '../helper.js'

/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {
    
    // return return
    if (!userManager.trustedJids.has(m.senderId)) return
    if (!textOnlyMessage(m)) return
    if (q) return

    const pc = `${prefix || ''}${command}`

    const footer = 'ketik `' + pc + ' -h` untuk bantuan.'
    if (!text) {
        const { isEnable, prefixList } = prefixManager.getInfo()
        const prefixStatus = `prefix status:\n> ${isEnable ? 'active' : 'not active'}\n\n`
        const prefixValue = prefixList.map((v, i) => `${(i + 1)} [${v}]`).join('   ')
        const daftarPrefix = `prefix list:\n> ${prefixValue}\n\n`
        const print = prefixStatus + daftarPrefix + footer
        return await sendText(sock, jid, print)
    } else {
        const param = text.match(/\S+/g)
        switch (param[0]) {
            case "on":
                const on = prefixManager.enable(true)
                return await sendText(sock, jid, on ? '✅ prefix aktif' : '🔔 prefix sudah aktif sebelumnya')

            case "off":
                const off = prefixManager.enable(false)
                return await sendText(sock, jid, off ? '✅ prefix mati' : '🔔 prefix sudah mati sebelumnya')

            case "add":
                if (!param[1]) return await sendText(sock, jid, `mana prefix barunya?\n\n${footer}`)
                const found = pluginManager.plugins.get(param[1])
                const isYourNewPrefixIsConfct = found?.config?.systemPlugin
                if (isYourNewPrefixIsConfct) return await sendText(jid, `prefix itu gak bisa di pakai. karena udah di pakai oleh plugin *${found.pluginName}*\n\n${footer}`)
                const add = prefixManager.add(param[1])
                return await sendText(sock, jid, add ? '✅ berhasil menambah *' + param[1] + '* ke dalam prefix list' : '🔔 prefix `' + param[1] + '` sudah ada.')

            case "del":
                if (!param[1]) return await sendText(jid, `prefix apa yang mau kamu hapus?\n\n${footer}`)
                const snapshotPrefix = prefixManager.prefixList[param[1] - 1] || param[1]
                const del = prefixManager.delete(param[1])
                return await sendText(sock, jid, del ? '✅ berhasil menghapus *' + snapshotPrefix + '* dari prefix list' : '❌ gagal hapus prefix `' + snapshotPrefix + '` pastikan prefix ada / index benar dan minimal ada 1 prefix tersisa setelah penghapusan.')

            default:
                return await sendText(sock, jid, param[0] + ' invalid\n\n' + footer)

        }
    }

}

handler.pluginName = 'prefix manager'
handler.description = 'command ini buat manage prefix.\n' +
    'contoh penggunaan:\n' +
    'prefix on (hidupkan prefix)\n' +
    'prefix off (non aktifkan prefix)\n' +
    'prefix add <prefix> (nambah prefix)\n' +
    'prefix del <indexPrefix|prefix> (hapus prefix>'
handler.command = ['prefix']
handler.category = ['manager']

handler.config = {
    systemPlugin: true,
    bypassPrefix: true,
    antiDelete: true,
}

handler.meta = {
    fileName: 'manager-prefix.js',
    version: '1',
    author: botInfo.an,
    note: 'i like no prefix',
}

export default handler