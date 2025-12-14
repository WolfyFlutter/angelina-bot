import { user, store } from '../../../index.js'
import { sendText, textOnlyMessage, Category, tag } from '../../helper.js'
import { isJidGroup, jidDecode } from 'baileys'

async function handler({ sock, m, text, q, jid, prefix, command }) {
    if (!user.trustedJids.has(m.senderId)) return
    if (!textOnlyMessage(m)) return


    const footer = 'ketik `' + command + ' -h` untuk bantuan.'
    const param = text.match(/\S+/g)


    if (!text) {
        const listTrustedUser = Array.from(user.trustedJids.entries()).map((v,i) => (`[${(i+1)}] ${v[1]}\n> ${v[0]}`)).join('\n\n')
        const listBlockedUser = Array.from(user.blockedJids.entries()).map((v,i) => (`[${(i+1)}] ${v[1]}\n> ${v[0]}`)).join('\n\n')
        const print = `trusted user\n\n` + listTrustedUser + '\n\n' + 'blocked user\n\n' + (listBlockedUser || 'tak ada')
        return await sendText(jid, print, m )
    }
    const opt = param[0]

    switch (opt) {
        case "trust":
            const trust_clean_text = text.substring(text.indexOf(opt) + 5).trim() //@1234567890123 teks (if any)
            if(q && trust_clean_text.match(/^(@\d{13,15})/)?.[1]) return await sendText(jid, "satu satu kocak. lu mau trust yang quoted apa teks yang lu kirim")
            const trust_lid = q ? ('@' + jidDecode(q.senderId).user) : trust_clean_text.match(/^(@\d{13,15})/)?.[1] //@1234567890123
            if (!trust_lid) return await sendText(jid, 'tag satu orang.', m)
            const trust_jid = trust_lid.replace('@', '') + ('@lid')
            let trust_desc = q ? trust_clean_text : trust_clean_text.substring(trust_lid.length).trim() //text
            if(!trust_desc) trust_desc = store.contacts.get(trust_jid)?.notify
            if (!trust_desc) return await sendText(jid, q ? 'gagal mendapatkan pushName dari store. tolong isikan note text setelah `' + command +' trust`': 'gagal mendapatkan pushName dari store. tolong ketikan note setelah tag user', m)
            const trust_result = user.manageTrustedJids('trust', trust_jid, trust_desc)
            const trust_print = trust_result ? `${trust_lid} di tambah ke trusted user. sebagai ${trust_desc}` : `${trust_lid} udah jadi owner kok. nothing changes`
            return await sendText(jid, trust_print)
        case "remove":
            const remove_validateNumber =(num) => num > 0 && num <= user.trustedJids.size
            const untrust_clean_text = text.substring(text.indexOf(opt) + 6).trim() //21 
            console.log(untrust_clean_text)
            const matchNumber = untrust_clean_text.match(/^\d+$/)?.[0] //@1234567890123
            if (!matchNumber) return await sendText(jid, 'input harus valid number', m)
            if(!remove_validateNumber(matchNumber)) return await sendText(jid, "invalid index", m)
            const untrust_result = user.manageTrustedJids('untrust', matchNumber)
            const untrust_print = untrust_result ? `${untrust_result} berhasil di hapus` : `huh`
            return await sendText(jid, untrust_print)

        case "block":
            const block_clean_text = text.substring(text.indexOf(opt) + 5).trim() //@1234567890123 teks (if any)
            if(q && block_clean_text.match(/^(@\d{13,15})/)?.[1]) return await sendText(jid, "satu satu kocak. lu mau trust yang quoted apa teks yang lu kirim")
            const block_lid = q ? ('@' + jidDecode(q.senderId).user) : block_clean_text.match(/^(@\d{13,15})/)?.[1] //@1234567890123
            if (!block_lid) return await sendText(jid, 'tag satu orang.', m)
            const block_jid = block_lid.replace('@', '') + ('@lid')
            let block_desc = q ? block_clean_text : block_clean_text.substring(block_lid.length).trim() //text
            if(!block_desc) block_desc = store.contacts.get(block_jid)?.notify
            if (!block_desc) return await sendText(jid, q ? 'gagal mendapatkan pushName dari store. tolong isikan note text setelah `' + command +' block`': 'gagal mendapatkan pushName dari store. tolong ketikan note setelah tag user', m)
            const block_result = user.manageBlockedJids('add', block_jid, block_desc)
            const block_print = block_result ? `${block_lid} di tambah ke block user. sebagai ${block_desc}` : `${block_lid} udah di block kok. nothing changes`
            return await sendText(jid, block_print)
        case "unblock":
            const unblock_validateNumber =(num) => num > 0 && num <= user.blockedJids.size
            const unblock_clean_text = text.substring(text.indexOf(opt) + 7).trim() //21 
            console.log(unblock_clean_text)
            const unblock_matchNumber = unblock_clean_text.match(/^\d+$/)?.[0] //@1234567890123
            if (!unblock_matchNumber) return await sendText(jid, 'input harus valid number', m)
            if(!unblock_validateNumber(unblock_matchNumber)) return await sendText(jid, "invalid index", m)
            const unblock_result = user.manageBlockedJids('remove', unblock_matchNumber)
            const unblock_print = unblock_result ? `${unblock_result} berhasil di hapus` : `huh`
            return await sendText(jid, unblock_print)
    }

    return await sendText(jid, 'awikwok... you need to read some doc bro... `' + command + ' -h` always be there for you.', m)
}

handler.preventDelete = true
handler.bypassPrefix = true
handler.pluginName = 'user manager'
handler.command = ['user']
handler.alias = []
handler.category = [Category.OWNER]
handler.help = 'gak tau males bikin deskripsi'

export default handler


