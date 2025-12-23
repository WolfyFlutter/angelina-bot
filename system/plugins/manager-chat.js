import { sendText, userManager, botInfo, textOnlyMessage } from '../helper.js'
import { GroupListenMode, PrivateListenMode } from '../manager-user.js'
import { isJidGroup } from 'baileys'

/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {
    if (!userManager.trustedJids.has(m.senderId)) return
    if (!textOnlyMessage(m)) return


    const footer = 'ketik `' + command + ' -h` untuk bantuan.'
    const param = text.match(/\S+/g)


    if (!text) {
        const { groupChatListenMode, listen, privateChatListenMode } = userManager.getStatus(jid)
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
        return await sendText(sock, jid, print)
    }
    const opt = param[0]
    const toggle = param[1]

    switch (opt) {
        case "group":
            let infog = ''
            if (toggle === "self") {
                const isChanged = userManager.groupChatToggle(GroupListenMode.SELF)
                infog = isChanged ? 'chat grup di set ke self (hanya listen ke owner untuk seluruh grup)' : 'udah woi'
            } else if (toggle === "default") {
                const isChanged = userManager.groupChatToggle(GroupListenMode.DEFAULT)
                infog = isChanged ? 'chat grup di set ke default (bot listen ke masing" grup setting)' : 'udah woi'
            } else if (toggle === "public") {
                const isChanged = userManager.groupChatToggle(GroupListenMode.PUBLIC)
                infog = isChanged ? 'bot akan respond siapapun di manapun di grup.' : 'udah woi'
            } else {
                infog = 'available param: self, everyone, default.\n\n' + footer
            }
            return await sendText(sock, jid, infog)
        case "private":
            let infop = ''
            if (toggle === 'self') {
                userManager.privateChatToggle(PrivateListenMode.SELF)
                infop = 'mode self pada private chat. yeyyy (⁠◕⁠ᴗ⁠◕⁠✿⁠)'
            } else if (toggle === 'public') {
                userManager.privateChatToggle(PrivateListenMode.PUBLIC)
                infop = `baik.. aku akan merespond siapapun yang chat pribadi`
            } else {
                infop = 'available param: self, everyone\n\n' + footer
            }
            return await sendText(sock, jid, infop)

        case "on":
            if (!isJidGroup(jid)) return await sendText(sock, jid, 'no. cuma bisa di grup')
            let name = text.slice(opt.length).trim()
            if (!name.length) {
                name = (await store.getGroupMetadata(jid)).subject
            }
            const l = userManager.manageGroupsWhitelist('add', jid, name)
            const pl = l ? `✅ bot aktif untuk grup ini` : `🔔 bot udah aktif kok`
            return await sendText(sock, jid, pl)
        case "off":
            if (!isJidGroup(jid)) return await sendText(sock, jid, 'no. cuma bisa di grup')
            const d = userManager.manageGroupsWhitelist('remove', jid)
            const pd = d ? `✅ sukses bot bisu` : `🔔 bot udah bisu woi`
            return await sendText(sock, jid, pd)
    }

    return await sendText(sock, jid, 'awikwok... you need to read some doc bro... `' + command + ' -h` always be there for you.', m)
}

handler.pluginName = 'chat manager'
handler.description = 'command ini buat manage user.. manage owner, manage blocked user.\n' +
    'contoh penggunaan:\n' +
    'untuk menambah owner kalian bisa gunakan command:'
'*user trust <mention> [\*note]*\n' +
    'atau reply ke pesan *user trust [\*note]*\n' +
    'menu <category>\n' +
    'menu all'
handler.command = ['chat']
handler.category = ['manager']

handler.config = {
    systemPlugin: true,
    antiDelete: true,
    bypassPrefix: true,
}

handler.meta = {
    fileName: 'manager-user.js',
    version: '1',
    author: botInfo.an,
    note: 'feel so cool',
}

export default handler