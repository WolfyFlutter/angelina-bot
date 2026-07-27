// serialize
import { messageSerialize } from "../../serializer/messages-serializer.js"
import { memberLabelSerialize } from "../../serializer/member-label-serialize.js"

// store
import { memberLabelStore } from "../../store/member-label-store.js"
import { contactStore } from "../../store/contact-store.js"
import { groupMetadataStore } from "../../store/group-metadata-store.js"
import { messageStore } from "../../store/message-store.js"
import { contentTypeStore } from "../../store/content-type-store.js"

// manager
import { prefixManager } from "../../manager/prefix-manager.js"
import { pluginManager } from "../../manager/plugin-manager.js"
import { menuManager } from "../../manager/menu-manager.js"
import { pluginAccessManager } from "../../manager/plugin-access-manager.js"
import { themeManager } from "../../manager/theme-manager.js"

// other
import { resolveCommand } from "../../command-resolve.js"
import { sendPluginHelp } from "../../helper/send-plugin-help.js"
import { printMessage } from "../../print-message.js"
import { db } from "../../database/database.js"

// external lib
import { areJidsSameUser, jidDecode, proto } from "baileys"
const ProtocolMessageType = proto.Message.ProtocolMessage.Type

const MARK = "serialize, prefix, command, ctx, plugin resolve"

import { getOneRandomElemenFrom } from "../../helper/common.js"
const HOW_ABOUT_NO_EMOJIS = ['🙅🏻', '🙅🏻‍♀️', '🙅🏻‍♂️']

/**
 * messages upsert handler
 * @param {import ("baileys").WASocket} sock 
 * @param {import ("baileys").BaileysEventMap['messages.upsert']} bem 
 */

const notifyHandler = async (bem, sock) => {
    const { messages } = bem
    for (const WAM of messages) {

        if (!WAM.message) {
            console.warn(`[notify no message]`, WAM)
            global.nodeMap.delete(WAM.key.id)
            continue
        }

        if (WAM?.category === "peer") {
            console.warn(`[peer message skip]`, WAM)
            global.nodeMap.delete(WAM.key.id)
            continue
        }

        const m = messageSerialize(WAM, sock)

        if (!m?.chat) {
            console.warn(`[notify no chat]`, WAM)
            global.nodeMap.delete(m.key.id)
            continue
        }

        if (!m?.contact) {
            console.warn(`[notify no contact]`, WAM)
            global.nodeMap.delete(m.key.id)
            continue
        }

        if (!m.contentType) {
            console.warn(`[notify no contentType]`, WAM)
            global.nodeMap.delete(m.key.id)
            continue
        }

        const prefixResult = prefixManager.resolvePrefix(m?.button?.id ?? m?.text)
        const commandResult = resolveCommand(prefixResult)

        // bikin konteks
        const ctx = {
            // penting
            sock,
            jid: m?.key?.remoteJid,
            m,
            q: m.q,

            // penting juga :v
            text: commandResult?.data,
            prefix: prefixResult?.prefix,
            command: commandResult?.command,

            // manager
            pluginManager,
            menuManager,
            prefixManager,
            pluginAccessManager,
            themeManager,

            // store
            contactStore,
            memberLabelStore,
            groupMetadataStore,
            messageStore,
            contentTypeStore,

            //
            db

        }

        const plugin = pluginManager.pluginMap.get(ctx?.command)

        try {
            // pastiin pesan cuma dari gc atau private chat
            if (!m.isGroup && !m.isPrivate) continue

            if (plugin) {

                // cek lock
                if (global?.isBotLocked && !plugin?.config?.bypassLock) continue

                const botQuoted = areJidsSameUser(ctx.sock.user.lid, ctx?.q?.contact?.primaryId)

                // cek akses dan kalau misal user via button kita kasih feedback react x or whatever
                if (!pluginAccessManager.hasAccess(m.chat, m.contact, plugin)) {
                    if (ctx?.m?.button && botQuoted) {
                        await ctx.m.react(getOneRandomElemenFrom(HOW_ABOUT_NO_EMOJIS))
                        continue
                    }
                    continue
                }

                // cek prefix atau button
                if (!prefixResult?.ok && !plugin?.config?.bypassPrefix && !m.button) continue

                // new perlu di audit
                if (m.button && !botQuoted) return

                // cek help
                if (!global?.isBotLocked && ctx.text === "-h") {
                    await sendPluginHelp(ctx)
                    continue
                }

                // plugin run
                await plugin.run(ctx)
            }

        } catch (e) {
            console.error(`plugin error`, e)
            await sock.sendMessage(ctx.jid, {
                text: '*duar plugin error*\n' + e.message
            }, { quoted: ctx.m })
        } finally {
            const messageIndex = messageStore.saveMessage(m)
            printMessage(m, {
                type: "notify",
                messageIndex
            })
        }
    }
}

export { notifyHandler }