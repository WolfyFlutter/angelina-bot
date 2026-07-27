
// serializer
import { memberLabelSerialize } from "../serializer/member-label-serialize.js"
import { participantUpdateSerialize } from "../serializer/participant-update-serialize.js"
import { contactSerialize } from "../serializer/contact-serialize.js"
import { chatSerialize } from "../serializer/chat-serialize.js"

// store
import { groupMetadataStore } from "./group-metadata-store.js"
import { memberLabelStore } from "./member-label-store.js"
import { contactStore } from "./contact-store.js"

import { WAMessageStubType, jidDecode, proto } from "baileys"
import { longNormalizer } from "../helper/common.js"

import { db } from "../database/database.js"


/**@import {BaileysEventMap, WASocket} from "baileys" */

const ProtocolMessageType = proto.Message.ProtocolMessage.Type
// LOOPING UNTUK FARMING DATA

// batch serialize, filtering, and maping to contactSerialize type
/**@type {Map <string, contactBase >} */
const tempContactBases = new Map()

/**@type {Set <string>} */
const tempChatBases = new Map()

let contactBaseArray = []
let chatBaseArray = []


class Store {
    /**
     * @param {BaileysEventMap} ev event map 
     * @param {WASocket} sock*/
    bind(ev, sock) {

        if (ev['messages.upsert']) {

            const bem = ev['messages.upsert']

            // APPEND
            if (bem.type === "append") {
                for (const WAM of bem.messages) {

                    // GROUP_PARTICIPANT_LABEL [BISA APPEND / NOTIFI]
                    if (WAM?.message?.protocolMessage?.type === ProtocolMessageType.GROUP_MEMBER_LABEL_CHANGE) {
                        const memberLabelBase = memberLabelSerialize(WAM)
                        memberLabelStore.update(memberLabelBase)
                    }

                    // CONTACT DAN CHAT 

                    // farming contact
                    const contactBase = contactSerialize(WAM, sock)

                    if (contactBase) {
                        if (contactBase.name) {
                            tempContactBases.set(contactBase.primaryId, contactBase)
                        }
                    } else {
                        console.warn(`append empty contact serialize`, WAM)
                    }

                    // farming chat
                    const chatBase = chatSerialize(WAM)
                    if (chatBase) {
                        tempChatBases.set(chatBase.primaryId, chatBase)
                    } else {
                        console.warn(`append skip chat`, WAM)
                    }


                    // GROUP_PARTICIPANT_UPDATE
                    if (WAM?.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_ADD) {
                        const base = participantUpdateSerialize(WAM, "add")
                        groupMetadataStore.upsertParticipant(base, sock)
                    }

                    else if (WAM?.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_REMOVE) {
                        const base = participantUpdateSerialize(WAM, "remove")
                        groupMetadataStore.upsertParticipant(base, sock)
                    }

                    else if (WAM?.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_PROMOTE) {
                        const base = participantUpdateSerialize(WAM, "promote")
                        groupMetadataStore.upsertParticipant(base, sock)
                    }

                    else if (WAM?.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_DEMOTE) {
                        const base = participantUpdateSerialize(WAM, "demote")
                        groupMetadataStore.upsertParticipant(base, sock)
                    }

                    else if (WAM?.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_LEAVE) {
                        const base = participantUpdateSerialize(WAM, "remove")
                        groupMetadataStore.upsertParticipant(base, sock)
                    }
                }

                contactBaseArray = Array.from(tempContactBases).map(c => c[1])
                chatBaseArray = Array.from(tempChatBases).map(c => c[1])

                db.exec("BEGIN TRANSACTION")
                contactBaseArray.forEach(cs => contactStore.upsertAndGetContact(cs))
                chatBaseArray.forEach(cs => contactStore.upsertAndGetContact(cs))
                db.exec("COMMIT")

                tempContactBases.clear()
                tempChatBases.clear()
                contactBaseArray.length = 0
                chatBaseArray.length = 0
            }

            // NOTIFY
            else if (bem.type === "notify") {
                for (const WAM of bem.messages) {
                    // GROUP_PARTICIPANT_LABEL [BISA APPEND / NOTIFI]
                    if (WAM?.message?.protocolMessage?.type === ProtocolMessageType.GROUP_MEMBER_LABEL_CHANGE) {
                        const memberLabelBase = memberLabelSerialize(WAM)
                        memberLabelStore.update(memberLabelBase)
                    }
                }
            }

        }

        if (ev['groups.upsert']) {
            db.exec(`BEGIN TRANSACTION`)
            for (const newGroupMetadata of ev['groups.upsert']) {
                groupMetadataStore.upsertGroupMetadata(newGroupMetadata, sock, true)
            }
            db.exec(`COMMIT`)
        }

        if (ev['groups.update']) {
            db.exec(`BEGIN TRANSACTION`)
            for (const newGroupMetadata of ev['groups.update']) {
                groupMetadataStore.upsertGroupMetadata(newGroupMetadata, sock)
            }
            db.exec(`COMMIT`)
        }

        if (ev['lid-mapping.update']) {
            contactStore.upsertSingleLidMapping(ev['lid-mapping.update'])
        }

    }
}

const store = new Store()
export { store }