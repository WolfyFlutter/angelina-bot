import { sendText, userManager, botInfo, textOnlyMessage, store } from '../helper.js'
import { GroupListenMode, PrivateListenMode } from '../manager-user.js'
import { isJidGroup } from 'baileys'

/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {
    if (!userManager.trustedJids.has(m.senderId)) return
    if (!textOnlyMessage(m)) return

    const pc = `${prefix || ''}${command}`
    const showHelp = `\n\nketik *${pc} -h* untuk bantuan`

    const param = text.match(/\S+/g)

    if (!text) {
        const { groupChatListenMode, listen, privateChatListenMode } = userManager.getStatus(jid)
        const g = ['self', 'public', 'default']
        const p = ['self', 'public']

        let tg = ''
        const gc = `🧑‍🧑‍🧒‍🧒 group: *${g[groupChatListenMode]}*`

        if (isJidGroup(jid)) {
            tg = groupChatListenMode === GroupListenMode.DEFAULT ? ` *(${(listen ? 'on' : 'off')})*` : ''
        }
        const pc = `👥 private: *${p[privateChatListenMode]}*`
        const print = '💬 chat mode\n\n' + gc + tg + '\n' + pc + showHelp
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
                infog = 'available param: self, everyone, default.' + showHelp
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
                infop = 'available param: self, everyone' + showHelp
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
handler.description = 'plugin ini buat manage response tiap chat. mirip bot mode publik/self tapi lebih fleksibel dan easy to use.\n' +
    'untuk jenis chat di bagi menjadi 2 yaitu *private* dan *group*.\nchat private memiliki 2 mode yaitu self dan public.\nchat group memiliki 3 mode yaitu self, public dan default.\n' +
    'mode self dan public pada group itu akan *meng-override* mode default tapi konfig default masi tetap disimpan (jika kembali ke mode default)\n\n' +
    'cara pakai\n\n' +
    'chat group self\n(atur self ke semua group, listen hanya ke owner)\n\n' +
    'chat group public\n(atur public ke semua group)\n\n' +
    'chat group default\n(atur bot listen default)\n\n' +
    'chat on\n(listen ke current group, harus mode default)\n\n' +
    'chat off\n(unlisten ke current group, harus mode default)\n\n' +
    'chat private self\n(gak respond siapapun di private chat kecuali owner)\n\n' +
    'chat private public\n(respond siapapun di private chat)'
handler.command = ['chat']
handler.category = ['built-in']

handler.config = {
    systemPlugin: true,
}

handler.meta = {
    fileName: 'chat-manager.js',
    version: '1',
    author: botInfo.an,
    note: 'feel safe',
}

export default handler