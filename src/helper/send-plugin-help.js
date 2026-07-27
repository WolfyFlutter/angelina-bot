/**
 * @import {Plugin, PluginCtx} from "../types/types.js"
 */

/**
 * 
 * @param {PluginCtx} ctx 
 * @returns {Promise <void>}
 */
const sendPluginHelp = async (ctx) => {
    const { pluginManager, command, sock, jid, q } = ctx

    // resolve plugin
    /**@type {Plugin} */
    const plugin = pluginManager.getPlugin(command)
    const { name, categories, description, commands, meta } = plugin
    const pluginVersion = plugin?.meta?.version || '(unknown)'
    const p_cmd = "*command*\n" + commands.join(", ") + "\n\n"
    const p_desc = "*description*\n" + description + "\n\n"
    const p_aut = "*author* ✨\n" + (meta?.author || '-') + "\n\n"
    const p_autn = "*author's note*\n" + (meta?.note || '-') + "\n\n"
    const p_ver = "*version*\n" + pluginVersion
    const content = p_cmd + p_desc + p_aut + p_autn + p_ver
    const url = meta?.url || "https://chat.whatsapp.com"
    const text = plugin?.config?.removeFirstUrl
        ? content
        : url + "\n" + content

    // send plugin ke chat
    return await sock.relayMessage(jid, {
        extendedTextMessage: {
            endCardTiles: [],
            text,
            matchedText: url,
            description: "🏷️ " + categories.sort().join(", "),
            title: name,
            previewType: 0,
            jpegThumbnail: "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",
            inviteLinkGroupTypeV2: 0,
            contextInfo: {
                stanzaId: q?.key?.id,
                participant: q?.contact?.lid,
                quotedMessage: q?.message
            }
        },

    }, {})
}

export { sendPluginHelp }