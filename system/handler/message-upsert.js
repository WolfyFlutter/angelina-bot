// local import
import { getErrorLine, sendText, pluginHelpSerialize, userManager, prefixManager, pluginManager, store, bot, tag  } from '../helper.js'
import serialize from "../serialize.js";
import consoleMessage from '../console-message.js';
import { Permission } from '../manager-user.js'
import allPath from '../all-path.js';

// node import
import { fileURLToPath } from "node:url";
import { isJidGroup, isLidUser, isPnUser } from 'baileys';

/**
 * @param {import ('baileys').WASocket} sock
 * @param {import('baileys').BaileysEventMap['messages.upsert']} bem
 */

const lockText = 'bot locked 🔒'
const unlockText = 'bot unlock 🔓✨\nlet\'s play!'

export default async function messageUpsertHandler(sock, bem) {

    const { messages, type } = bem;
    // NOTIFY
    if (type === "notify") {
        // NOTIFY
        for (let i = 0; i < messages.length; i++) {
            const IMessage = messages[i];
            try {
                /*
                gw gak ngerti konsep middleware T^T, anggap aja ini kek middleware
                mirip firewall atau apalah :v
                */

                // message stubtype
                if (IMessage.messageStubType) {
                    console.log('unhandle messageStubType', IMessage)
                    continue
                }

                // protocol message
                else if (IMessage.message?.protocolMessage) {
                    const protocolType = IMessage.message?.protocolMessage?.type

                    // protocol delete
                    if (protocolType === 0) {
                        console.log(`[protocol] hapus, di hapus oleh ${IMessage.pushName}`)
                        continue
                    }

                    // protocol edit
                    else if (protocolType === 14) {
                        console.log('[protocol] edit todo')
                        continue
                    }

                    // fallback for future notifi protocol handling
                    console.log("[protocol] unhandle", IMessage);
                    continue
                }

                // empty message
                if (!IMessage.message) {
                    console.log("[empty message]", IMessage);
                    continue
                }

                // no pushname message
                else if (!IMessage?.pushName) {
                    console.log("[message without pushname]", IMessage);
                    continue
                }

                // actual notification message

                // [READ USER PERMISSION]
                const user = userManager.isAuth(IMessage.key)

                // [BLOCKED JID] return
                if (user.permission === Permission.BLOCKED) {
                    console.log(user.message, userManager.blockedJids.get(user.jid) + ' at ' + (store.groupMetadata.get(IMessage.key?.remoteJid)?.subject || IMessage.key.remoteJid) + '\n')
                    continue
                }

                // [SERIALIZE]
                const m = serialize(IMessage)
                const q = m.q
                const mPrint = consoleMessage(m, q, store)

                // [PUT YOUR ADDITIONAL MIDDLEWARE HERE (IF ANY)]

                // IN GROUP
                if (isJidGroup(m.chatId)) {
                    // BOT LOCK / UNLOCK 
                    const mentionedJid = m.message?.[m.type]?.contextInfo?.mentionedJid
                    const botMentioned = mentionedJid?.some(lid => lid === bot.lid)
                    if (/^lock/.test(m.text)) {
                        if (!userManager.trustedJids.has(m.senderId)) continue
                        if (!botMentioned) continue
                        if (global.botLock) continue
                        global.botLock = true
                        const print = global.botLock ? lockText : unlockText
                        await sendText(sock, m.chatId, print)
                        continue
                    }

                    else if (/^unlock/.test(m.text)) {
                        if (!userManager.trustedJids.has(m.senderId)) continue
                        if (!botMentioned) continue
                        if (!global.botLock) continue
                        global.botLock = false
                        const print = global.botLock ? lockText : unlockText
                        await sendText(sock, m.chatId, print)
                        continue
                    }

                    // AFK
                    else if (mentionedJid?.length) {
                        console.log('here', mentionedJid)
                        // afk
                        for (const jid of mentionedJid) {
                            if (global?.afk?.[jid]) {
                                await sendText(sock, m.chatId, `lagi afk dia.. katanya lagi ${global.afk[jid].reason}`, m)
                                continue
                            }
                        }
                    }




                }

                // IN PRIVATE CHAT
                else if (isLidUser(m.chatId)) {
                    // BOT LOCK / UNLOCK 
                    if (/^lock/.test(m.text)) {
                        if (!userManager.trustedJids.has(m.senderId)) continue
                        if (global.botLock) continue
                        global.botLock = true
                        const print = global.botLock ? lockText : unlockText
                        await sendText(sock, m.chatId, print)
                        continue
                    }

                    else if (/^unlock/.test(m.text)) {
                        if (!userManager.trustedJids.has(m.senderId)) continue
                        if (!global.botLock) continue
                        global.botLock = false
                        const print = global.botLock ? lockText : unlockText
                        await sendText(sock, m.chatId, print)
                        continue
                    }
                }

                // [END OF PUT YOUR ADDITIONAL MIDDLEWARE HERE IF ANY]


                // [USER NOT ALLOWED] return
                if (user.permission === Permission.NOT_ALLOWED) {
                    console.log(`[not allowed] [save db]\n` + mPrint)
                    continue
                }

                if (!m.text) {
                    console.log(`[empty text] [save db]\n` + mPrint)
                    continue
                }

                //if (m.key.fromMe) continue

                let handler = null
                let command = null
                try {

                    const { valid, prefix } = prefixManager.isMatchPrefix(m.text)
                    const textNoPrefix = prefix ? m.text.slice(prefix.length).trim() : m.text.trim()
                    command = textNoPrefix.split(/\s+/g)?.[0]

                    handler = pluginManager.plugins.get(command)
                    if (handler && !global.botLock) {
                        if (valid || handler.config?.bypassPrefix) {
                            const jid = m.key.remoteJid
                            const text = textNoPrefix.slice(command.length + 1) // command text => |text|
                            console.log(text)
                            if (text === '-h') {
                                await sendText(sock, m.chatId, pluginHelpSerialize(handler))
                            } else {
                                await handler({ sock, jid, text, m, q, prefix, command });
                            }
                        }

                    }

                } catch (e) {
                    console.error(e.stack)
                    const errorLine = getErrorLine(e.stack) || 'gak tauu..'
                    const print = `🤯 *plugin fail*\n✏️ used command: ${command}\n📄 dir: ${fileURLToPath(handler.dir).replace(allPath.root, '').replaceAll('\\', '/')}\n🐞 line: ${errorLine}\n✉️ error message:\n${e.message}`
                    //await react(m, '🥲')
                    await sendText(sock, m.chatId, print, m)
                    continue
                }


                console.log(`[lookup command] [save db]\n` + mPrint)
                continue


            } catch (e) {
                console.error(e);
                console.log(JSON.stringify(IMessage, null, 2));
            }
        }
    }

    // APPEND
    else {
        for (let i = 0; i < messages.length; i++) {
            const IMessage = messages[i];
            try {

                // message stubtype
                if (IMessage.messageStubType) {
                    console.log('[append] unhandle messageStubType', IMessage)
                    continue
                }

                // protocol message
                else if (IMessage.message?.protocolMessage) {
                    const type = IMessage.message?.protocolMessage?.type

                    // protocol delete
                    if (type === 0) {
                        console.log(`[append] protocol hapus, di hapus oleh ${IMessage.pushName}`)
                        continue
                    }

                    // protocol edit
                    else if (type === 14) {
                        console.log('[append] protocol edit todo')
                        continue
                    }

                    // fallback for future notifi protocol handling
                    console.log("[append] unhandle protocolMessage", IMessage);
                    continue
                }

                // no pushname message
                else if (!IMessage?.pushName) {
                    console.log("[append] objek tanpa pushname", IMessage);
                    continue
                }

                // empty message
                if (!IMessage.message) {
                    console.log("[append] objek tanpa message", IMessage);
                    continue
                }

                // actual notification message

                // filter jid, blocked
                const v = userManager.isAuth(IMessage.key)
                if (v.permission === Permission.BLOCKED) {
                    console.log('[append] ' + v.message, userManager.blockedJids.get(v.jid) + ' at ' + (store.groupMetadata.get(IMessage.key?.remoteJid)?.subject || IMessage.key.remoteJid) + '\n')
                    continue
                }

                // serialize
                const m = serialize(IMessage)
                const q = m.q
                const mPrint = consoleMessage(m, q, store)

                if (v.permission === Permission.NOT_ALLOWED) {

                    console.log(`[append] [not allowed] [save db]\n` + mPrint)
                    continue
                }

                if (!m.text) {

                    console.log(`[append] [empty text] [save db]\n` + mPrint)
                    continue
                }

                //if (m.key.fromMe) continue

                console.log(`[append] [lookup command] [save db]\n` + mPrint)
                continue


            } catch (e) {
                console.error(e);
                console.log(JSON.stringify(IMessage, null, 2));
            }
        }
    }

}


// event
//console.log('babarbabr', m)
// deteksi view once
// const viewOnce = m?.message?.[m.type]?.viewOnce
// if (viewOnce) {
//   //await sock.sendMessage(m.chatId, {text: 'view once.. restore ah'}, {quoted: m})
//   m.message[m.type].viewOnce = false
//   await sock.sendMessage(m.chatId, { forward: m, contextInfo: { isForwarded: false } }, { quoted: m })
//   continue
// }