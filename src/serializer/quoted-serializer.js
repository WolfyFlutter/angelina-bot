import { areJidsSameUser, getContentType, jidDecode, isJidGroup } from "baileys";
import { contactStore } from "../store/contact-store.js";
import { memberLabelStore } from "../store/member-label-store.js";
import { groupMetadataStore } from "../store/group-metadata-store.js";
import { download, react, reply, del } from "./messages-function-bind.js";
import { contentSerialize } from "./content-serialize.js";
import { contentTypeStore } from "../store/content-type-store.js";

/**
 * @import {WAMessage, WAMessageKey, MessageWithContextInfo, WASocket, proto} from 'baileys'
 * @import {groupKeyMessage, messageSerialize} from '../types/types.js'
 * @import {extra} './messages-serializer.js'
*/

/**
 * 
 * @param {messageSerialize} m
 * @param {WASocket} sock
 * @returns {messageSerialize} 
 */

const quotedMessageSerialize = (m, sock) => {
    /**@type {MessageWithContextInfo} */
    const _mc = m.contentType?.content
    const quotedMessage = m?.message?.[_mc]?.contextInfo?.quotedMessage


    if (quotedMessage) {
        const contextInfo = m?.message?.[_mc]?.contextInfo
        const participantJid = contextInfo?.participant

        // q.key
        /**@type {WAMessageKey} */
        const key = {
            id: contextInfo?.stanzaId,
            participant: participantJid,
            remoteJid: m.key?.remoteJid,
            fromMe: (areJidsSameUser(participantJid, sock?.user?.lid) || areJidsSameUser(participantJid, sock?.user?.id))
        }

        // q.message
        const message = quotedMessage

        // q.chat
        const chat = contactStore.upsertAndGetContact({
            primaryId: m.key?.remoteJid
        })

        // q.contact
        let contact
        const server = jidDecode(participantJid)?.server
        if (server === "s.whatsapp.net") {
            contact = contactStore.getContactByPn(participantJid)
        } else if (server === "lid") {
            contact = contactStore.upsertAndGetContact({
                primaryId: participantJid
            })
        } else {
            contact = undefined
        }

        //q.button gaada ya :v

        // q.group
        /**@type {groupKeyMessage} */
        let group = undefined
        if (isJidGroup(m.key?.remoteJid) && contact && chat) {
            const admin = groupMetadataStore.getAllAdminByGroupJid(m.key?.remoteJid)
            const memberLabelGroup = memberLabelStore.getAllMemberLabel(m.key.remoteJid)
            group = {
                admin: admin?.[contact?.primaryId],
                label: memberLabelGroup?.[contact?.primaryId]
            }
        }

        // q.contentType
        const _messageContentBase = contentSerialize({
            message
        })
        const contentType = contentTypeStore.getMessageContent(_messageContentBase)


        // q.content
        const content = contentType?.content

        // q.text
        const m_ct = message?.[content]
        const text = message?.conversation ||
            m_ct?.text ||
            m_ct?.caption ||
            m_ct?.body?.text


        /**@type {messageSerialize} */
        const q = {
            isPrivate: m.isPrivate,
            isGroup: m.isGroup,
            group,

            chat,
            contact,
            contentType,
            key,
            message,

            sender: contact?.primaryId,
            pushName: contact?.name,
            text,
            content
        }

        // buat eval evalan
        q.download = download
        q.react = react
        q.reply = reply
        q.delete = del

        //WAM.sock = sock
        Object.defineProperty(q, "sock", {
            get() {
                return sock
            },
            enumerable: false,
            configurable: false
        })

        return q

    } else {
        return undefined
    }
}

export { quotedMessageSerialize }
