import { sendText, botInfo, store, userManager } from '../helper.js'
import { getDevice, isJidGroup } from 'baileys'


/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {
    const lookupPn = (gm, lid) => gm.participants.find(p => p.id === lid)?.phoneNumber
    const getId = () => undefined

    const mese = m.q || m
    const { pushName, key } = mese
    const groupMessage = isJidGroup(key.remoteJid)
    let gm
    if (groupMessage) {
        gm = store.groupMetadata.get(key.remoteJid)
        if (!gm) return await sendText(sock, jid, "store belum siap, coba lagi", m)
    }

    const rpn = async (hm, gm, mOri) => {
        let pn
        if (groupMessage) {
            pn = lookupPn(gm, hm.senderId)
        } else {
            pn = hm.key.fromMe ? bot.pn : mOri.key.remoteJidAlt
        }
        return pn
    }

    const rl = async (hm) => {
        if (groupMessage) {
            return mese.senderId
        } else {
            return hm.key.fromMe ? bot.lid : hm.senderId
        }
    }

    const ra = (hm) => {
        if (groupMessage) {
            const s = store.groupMetadata.get(hm.key.remoteJid)
            if (!s) return "store belum siap"
            console.log(s.participants.find(p => p.id === hm.senderId))
            return s.participants.find(p => p.id === hm.senderId)?.admin ? 'ya' : 'tidak'
        } else {
            return 'no, cek di grup aja'
        }
    }

    // db index
    const query = getId(key.id, key.remoteJid)
    const id = query?.id ? query.id : 'tidak ada'

    const resolveLid = await rl(mese)
    const resolvePn = await rpn(mese, gm, m)

    const flip = m.key.addressingMode === 'pn'

    const p_pushName = `name : ${pushName}\n`
    const p_device = `from : ${getDevice(key.id)}\n`
    const p_lid = `lid  : ${flip ? resolvePn : resolveLid}\n`
    const p_pn = `pn   : ${flip ? resolveLid : resolvePn}\n`
    const p_chatId = `jid  : ${key.remoteJid}\n`
    const p_admin =  `admin: ${ra(mese)}\n`


    const p_messageId = `id\n${key.id}\n\n`
    const p_message_type = `type\n${mese.type}`
    const p_text = `> text\n${mese.text}`

    const isTrusted = userManager.trustedJids.get(mese.senderId)
    const isBanned = userManager.blockedJids.get(mese.senderId)
    const p_isTrusted = 'trust: ' + (isTrusted ? 'yes (' + isTrusted + ')' : 'no') + '\n'
    const p_isBanned = 'block: ' + (isBanned ? 'yes (' + isBanned + ')' : 'no') + '\n'
    const p_indexMessage = 'index: ' + id + '\n'


    const print =
        '👤 *account*\n' +
        '```' + p_pushName + p_device + p_lid + p_pn + p_chatId + p_admin + '```\n' +
        '📝 *bot note*\n' +
        '```' + p_isTrusted + p_isBanned + p_indexMessage + '```\n' +
        '✉️ *message*\n' +
        '```' + p_messageId + p_message_type + '```'



    //const _print = header + p_pushName + p_messageId + p_device + p_chatId + p_lid + p_pn + p_message_type + p_text
    return await sendText(sock, jid, print, mese)
}

handler.pluginName = 'inspect message'
handler.description = 'menu inspect message.. buat liat data data penting dari message.. cara pakai nya reply ke pesan lalu ketik command nya'
handler.command = ['im']
handler.category = ['built-in']

handler.config = {
    systemPlugin: true,
}

handler.meta = {
    fileName: 'inspect-message.js',
    version: '1',
    author: botInfo.an,
    note: 'kamu suka kepo',
}

export default handler