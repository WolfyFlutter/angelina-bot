import { user, store } from '../../../index.js'
import { GroupListenMode, PrivateListenMode } from '../../user-manager.js'
import { sendText, textOnlyMessage, Category } from '../../helper.js'
import { isJidGroup } from 'baileys'

async function handler({ sock, jid, text = '', m, q, prefix = '', command }) {
    if (!user.trustedJids.has(m.senderId)) return
    if (!textOnlyMessage(m)) return
    const footer = 'ketik `' + command + ' -h` untuk bantuan.'
    if (!text) {
        const { groupChatListenMode, listen, privateChatListenMode } = user.getStatus(jid)
        const g = ['self', 'public', 'default']
        const p = ['self', 'public']

        let gc = ''
        let tg = ''
        const headers = 'chat mode\n'
        if (isJidGroup(jid)) {
            gc = `> group: *${g[groupChatListenMode]}*`
            tg = groupChatListenMode === GroupListenMode.DEFAULT ? ` *(${(listen ? 'on' : 'off')})*` : ''
        }
        const pc = `> private: *${p[privateChatListenMode]}*`
        const print = 'chat mode\n' + gc + tg + '\n' + pc + '\n\n' + footer
        return await sendText(jid, print)
    }
    const param = text.match(/\S+/g)
    const opt = param[0]
    const toggle = param[1]

    switch (opt) {
        case "group":
            let infog = ''
            if (toggle === "self") {
                user.groupChatToggle(GroupListenMode.SELF)
                infog = 'chat grup di set ke self (hanya listen ke owner untuk seluruh grup)'
            } else if (toggle === "default") {
                user.groupChatToggle(GroupListenMode.DEFAULT)
                infog = 'chat grup di set ke default (bot listen ke masing" grup setting)'
            } else if (toggle === "everyone") {
                user.groupChatToggle(GroupListenMode.PUBLIC)
                infog = 'bot akan respond siapapun di manapun di grup.'
            } else {
                infog = 'available param: self, everyone, default.\n\n' + footer
            }
            return await sendText(jid, infog)
        case "private":
            let infop = ''
            if (toggle === 'self') {
                user.privateChatToggle(PrivateListenMode.DISABLE)
                infop = 'mode self pada private chat. yeyyy (⁠◕⁠ᴗ⁠◕⁠✿⁠)'
            } else if (toggle === 'everyone') {
                user.privateChatToggle(PrivateListenMode.ENABLE)
                infop = `baik.. aku akan merespond siapapun yang chat pribadi`
            } else {
                infop = 'available param: self, everyone\n\n' + footer
            }
            return await sendText(jid, infop)

        case "on":
            if (!isJidGroup(jid)) return await sendText(jid, 'no. cuma bisa di grup')
            let name = text.slice(opt.length).trim()
            if (!name.length) {
                name = (await store.getGroupMetadata(jid)).subject
            }
            const l = user.manageGroupsWhitelist('add', jid, name)
            const pl = l ? `✅ bot aktif untuk grup ini` : `🔔 bot udah aktif kok`
            return await sendText(jid, pl)
        case "off":
            if (!isJidGroup(jid)) return await sendText(jid, 'no. cuma bisa di grup')
            const d = user.manageGroupsWhitelist('remove', jid)
            const pd = d ? `✅ sukses bot bisu` : `🔔 bot udah bisu woi`
            return await sendText(jid, pd)
    }

    return await sendText(jid, 'awikwok... you need to read some doc bro... `' + command + ' -h` always be there for you.', m)
}

handler.preventDelete = true
handler.bypassPrefix = true
handler.pluginName = 'chat manager'
handler.command = ['chat']
handler.alias = []
handler.category = [Category.OWNER]
handler.help = 'gak tau males bikin deskripsi'

export default handler


