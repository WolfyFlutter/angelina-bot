// store import
import { groupMetadataStore } from "../store/group-metadata-store.js"
import { memberLabelStore } from "../store/member-label-store.js"
import { contactStore } from "../store/contact-store.js"
import { contentTypeStore } from "../store/content-type-store.js"

// serialize import
import { buttonSerialize } from "./button-serializer.js"
import { quotedMessageSerialize } from "./quoted-serializer.js"
import { contactSerialize } from "./contact-serialize.js"
import { chatSerialize } from "./chat-serialize.js"
import { contentSerialize } from "./content-serialize.js"

// message utility import
import { del, download, react, reply } from "./messages-function-bind.js"

import { getContentType } from "baileys"

/**
 * @import { WAMessage, WASocket, getContentType, proto } from 'baileys
 * @import { buttonSerialize } from '../serializer/button-serializer.js' 
 * @import { messageSerialize } from "../types/types.js"
 */

/**
 * wakwau
 * @param {WAMessage} WAM 
 * @param {WASocket} sock
 * @returns {messageSerialize}
 */

const messageSerialize = (WAM, sock) => {

    const m = { ...WAM }

    // m.chat
    const _chatBase = chatSerialize(m)
    const chat = contactStore.upsertAndGetContact(_chatBase)
    m.chat = chat

    // m.contact
    const _contactBase = contactSerialize(m, sock)
    const contact = contactStore.upsertAndGetContact(_contactBase)
    m.contact = contact

    // m.contentType
    const _contentBase = contentSerialize(WAM)
    m.contentType = contentTypeStore.getMessageContent(_contentBase)

    // m.button [hidden]
    const button = buttonSerialize(m)
    m.button = button

    // m.isPrivate
    const isPrivate = chat?.primaryServer === "lid"
    m.isPrivate = isPrivate

    // m.isGroup
    const isGroup = chat?.primaryServer === "g.us"
    m.isGroup = isGroup

    // m.group
    let group = undefined
    if (contact && chat && isGroup) {
        const admin = groupMetadataStore.getAllAdminByGroupJid(m.key?.remoteJid)
        const memberLabelGroup = memberLabelStore.getAllMemberLabel(m.key.remoteJid)
        group = {
            admin: admin?.[contact.primaryId],
            label: memberLabelGroup?.[contact?.primaryId]
        }
    }
    m.group = group

    // m.q
    const q = quotedMessageSerialize(m, sock)
    m.q = q

    // [SHORTCUT]

    // m.content
    m.content = _contentBase.content

    // m.text
    const ct = m.message?.[_contentBase.content]
    const text = m?.message?.conversation ??
        ct?.text ??
        ct?.caption ??
        ct?.body?.text
    m.text = text

    // m.sender
    m.sender = contact?.primaryId

    // bonus.. fungsi buat eval evalan
    m.download = download
    m.react = react
    m.reply = reply
    m.delete = del

    //WAM.sock = sock [hidden]
    Object.defineProperty(m, "sock", {
        get() {
            return sock
        },
        enumerable: false,
        configurable: false
    })

    // ADDITIONAL
    m.node = global.nodeMap.get(m.key.id)
    global.nodeMap.delete(m.key.id)
    return m
}

export { messageSerialize }