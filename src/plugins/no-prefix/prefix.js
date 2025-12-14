import { prefixManager, pluginsNoPrefix, user } from './../../../index.js'
import { sendText, textOnlyMessage, Category } from './../../helper.js'

async function handler({ sock, m, text, jid, prefix, command }) {

  if (!user.trustedJids.has(m.senderId)) return
  if (!textOnlyMessage(m)) return

  const footer = 'ketik `' + command + ' -h` untuk bantuan.'
  if (!text) {
    const { isEnable, prefixList } = prefixManager.getInfo()
    const prefixStatus = `prefix status:\n> ${isEnable ? 'active' : 'not active'}\n\n`
    const prefixValue = prefixList.map((v, i) => `${(i + 1)} [${v}]`).join('   ')
    const daftarPrefix = `prefix list:\n> ${prefixValue}\n\n`
    const print = prefixStatus + daftarPrefix + footer
    return await sendText(m.chatId, print)
  } else {
    const param = text.match(/\S+/g)
    switch (param[0]) {
      case "on":
        const on = prefixManager.enable(true)
        return await sendText(m.chatId, on ? '✅ prefix aktif' : '🔔 prefix sudah aktif sebelumnya')

      case "off":
        const off = prefixManager.enable(false)
        return await sendText(m.chatId, off ? '✅ prefix mati' : '🔔 prefix sudah mati sebelumnya')

      case "add":
        if (!param[1]) return await sendText(m.chatId, `mana prefix barunya?\n\n${footer}`)
        const found = pluginsNoPrefix.get(param[1])
        if (found) return await sendText(m.chatId, `prefix itu gak bisa di pakai. karena udah di pakai oleh plugin *${found.pluginName}*\n\n${footer}`)
        const add = prefixManager.add(param[1])
        return await sendText(m.chatId, add ? '✅ berhasil menambah *' + param[1] + '* ke dalam prefix list' : '🔔 prefix `' + param[1] + '` sudah ada.')

      case "del":
        if (!param[1]) return await sendText(m.chatId, `prefix apa yang mau kamu hapus?\n\n${footer}`)
        const snapshotPrefix = prefixManager.prefixList[param[1] - 1] || param[1]
        const del = prefixManager.delete(param[1])
        return await sendText(m.chatId, del ? '✅ berhasil menghapus *' + snapshotPrefix + '* dari prefix list' : '❌ gagal hapus prefix `' + snapshotPrefix + '` pastikan prefix ada / index benar dan minimal ada 1 prefix tersisa setelah penghapusan.')

      default:
        return await sendText(m.chatId, param[0] + ' invalid\n\n' + footer)
    }
  }
}

handler.preventDelete = true
handler.bypassPrefix = true
handler.pluginName = 'prefix'
handler.command = ['prefix']
handler.alias = []
handler.category = [Category.OWNER]
handler.help = 'Plugin ini buat manage prefix. Kamu bisa hidupkan/matikan prefix. Berlaku untuk global (chat pribadi dan grup). Prefix yang kamu tambahkan bisa digunakan semua. Akan di cocokkan dengan salah satu list prefix. Berikut adalah command yang bisa kamu pakai buat manage prefix.\n\n' +
  'tambah prefix\n> ' + handler.command + ' add <prefix>\n\n' +
  'hapus prefix\n> ' + handler.command + ' del <prefix|index>\n\n' +
  'aktifkan/matikan prefix\n> ' + handler.command + ' <on|off>\n\n' +
  'lihat status prefix\n> ' + handler.command

export default handler
