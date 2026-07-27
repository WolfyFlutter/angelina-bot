import { db } from '../database/database.js'
import { humanTimeFromSecond } from '../helper/common.js'

/**
 * @import {Plugin, PluginCtx} from "../types/types.js"
 */

/**@param {PluginCtx} ctx */
async function run(ctx) {
    const { sock, m, q, text, jid } = ctx
    const wam = q || m

    const contactId = wam.contact.id

    const result = stmt.all({
        contactId
    })

    if (!result) return await m.reply(`no result from database O.o`)

    const print = parse(result, ctx)

    return await sock.sendMessage(jid, {
        text: print
    })
}

const stmt = db.prepare(`

SELECT
chat.name as gcName,
gp.admin as role,
gp.kicked_at as kickedAt,
kicker.name as kickedBy
FROM group_participants gp

LEFT JOIN contacts chat
ON gp.chat_id = chat.id

LEFT JOIN contacts kicker
ON gp.kicked_by = kicker.id

WHERE gp.contact_id = :contactId
ORDER BY
lower(chat.name)

`)

/**
 * 
 * @param {*} resultDatabase 
 * @param {PluginCtx} ctx 
 */
const parse = (resultDatabase, ctx) => {
    const { jid, sock, m, q } = ctx
    const gcSuperAdmin = []
    const gcAdmin = []
    const gcMember = []
    const gcOut = []

    resultDatabase.forEach(v => {
        const { gcName, role, kickedAt, kickedBy } = v
        if (role === "superadmin") {
            gcSuperAdmin.push(gcName)
        }

        else if (role === "admin") {
            gcAdmin.push(gcName)
        }

        else if (kickedAt)
            gcOut.push({
                gcName,
                kickedBy,
                kickedAt
            })
        else {
            gcMember.push(gcName)
        }
    })

    const wam = q || m
    const name = wam?.contact?.name || `beliau`
    const totalGc = gcSuperAdmin.length + gcAdmin.length + gcMember.length
    const p_name = `found ${name} in ${totalGc} group chat${totalGc > 1 ? 's' : ''}!\n\n`

    const p_gc_superadmin_full = `*role superadmin*` + ` (${gcSuperAdmin.length} gc)\n` +
        (gcSuperAdmin
            .map(v => `- ${v}`)
            .join('\n') || "-") + '\n\n'

    const p_gc_admin_full = `*role admin*` + ` (${gcAdmin.length} gc)\n` +
        (gcAdmin
            .map(v => `- ${v}`)
            .join('\n') || "-") + '\n\n'

    const p_gc_member_full = `*role member*` + ` (${gcMember.length} gc)\n` +
        (gcMember
            .map(v => `- ${v}`)
            .join('\n') || "-") + '\n\n'

    const p_gc_out_full = `*gc out (${gcOut.length})*\n` +
        (gcOut
            .map(v => "- " + v.gcName +
                '\n> kicked by ' + v.kickedBy +
                '\n> pada ' + humanTimeFromSecond(v.kickedAt))
            .join('\n') || "-")

    const print = p_name
        + (gcSuperAdmin.length ? p_gc_superadmin_full : '')
        + (gcAdmin.length ? p_gc_admin_full : '')
        + (gcMember.length ? p_gc_member_full : '')
        + (gcOut.length ? p_gc_out_full : '')

    return print.trim()
}

/** @type {Plugin} */
const plugin = { run }
plugin.name = "mutual group chat"
plugin.commands = ["mgc"]
plugin.categories = ["other"]
plugin.description = "buat nampilin mutual gc antara bot dan contact"

plugin.meta = {
    fileName: "mutual-group-chat.js",
    author: "wolep",
    note: "plugin gabut buat test query O.o",
    version: "1"
}

export default plugin