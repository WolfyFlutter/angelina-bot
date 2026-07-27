/**
 * @import {Plugin, PluginCtx} from "../types/types.js"
 */

import { db } from '../database/database.js'
import { humanTimeFromSecond } from '../helper/common.js'

/**
 * main fungsi plugin
 * @param { PluginCtx } ctx
 * @returns { Promise <any> } */
async function run(ctx) {
    const { sock, m, q, text, jid } = ctx
    const wam = q || m

    const DBResult = sexyQuery.get({
        chatId : m.chat.id,
        contactId : wam.contact.id
    })
    if (!DBResult) return await m.reply(`👻 no result from database`)

    const sexyText = magic(DBResult)

    return await sock.sendMessage(jid, {
        text: sexyText
    })
}

const sexyQuery = db.prepare(`
SELECT 
    contact.name as pushName,
    gp.invited_at as invitedAt,
    contactInvitedBy.name as invitedBy,
    gp.admin as role,
    gp.admin_updated_at as roleUpdatedAt,
    contactAdminUpdatedBy.name as roleUpdatedBy,
    gp.label as label,
    gp.label_updated_at as labelUpdatedAt,
    gp.chat_id

FROM group_participants gp

LEFT JOIN contacts contact
ON gp.contact_id = contact.id

LEFT JOIN contacts contactInvitedBy
ON gp.invited_by = contactInvitedBy.id

LEFT JOIN contacts contactAdminUpdatedBy
ON gp.admin_updated_by = contactAdminUpdatedBy.id

WHERE chat_id = :chatId
    AND contact_id = :contactId
  --AND gp.kicked_at IS NULL

ORDER BY
	gp.invited_at DESC
`)

const magic = (DBResult) => {
    const IDK = '-'
    const { pushName, invitedAt, invitedBy, role, roleUpdatedBy, roleUpdatedAt, label, labelUpdatedAt } = DBResult
    const kataKata = `*🪪 member inspect*

name : ${pushName ?? IDK}
since : ${humanTimeFromSecond(invitedAt) ?? IDK}
by : ${invitedBy ?? IDK}

role: ${role ?? 'member'}
at : ${humanTimeFromSecond(roleUpdatedAt) ?? IDK}
by : ${roleUpdatedBy ?? IDK}

label : ${label ?? (labelUpdatedAt ? '(di hapus)' : IDK)}
at : ${humanTimeFromSecond(labelUpdatedAt) ?? IDK}`

    return kataKata
}

/** @type {Plugin} */
const plugin = { run }
plugin.name = "member info"
plugin.commands = ["mi"]
plugin.categories = ["other"]
plugin.description = "menampilkan sedikit catatan digital seseorang, cocok di coba dalam sebuah grup"

plugin.meta = {
    fileName: "member-info.js",
    author: "wolep",
    note: "gabut",
    version: "1"
}

export default plugin