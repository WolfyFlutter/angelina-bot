import { prepareWAMessageMedia } from "baileys"
/**
 * @import {WASocket, WAMessageContent, AnyMediaMessageContent, WAMessage} from "baileys"
 */

class Interactive {

    /**@type {WAMessageContent} */
    message = {
        interactiveMessage: {
            body: {
                text: ''
            },
            header: {},
            footer: {},
            nativeFlowMessage: {
                buttons: [],
                messageParamsJson: null,
            }
        }
    }

    /**@type {AnyMediaMessageContent} */
    temp

    /**
     * 
     * @param {WASocket} sock 
     */
    constructor(sock) {
        this.sock = sock
    }

    /**
     * @typedef {object} SendOpts
     * @property {WAMessage} quoted
     */
    /**
     * 
     * @param {string} jid 
     * @param {SendOpts} [opts]
     * @returns {Promise<any>}
     */
    async send(jid, opts = {}) {
        const { quoted } = opts
        if (quoted) {
            this.message.interactiveMessage.contextInfo = {
                stanzaId: quoted.key.id,
                participant: quoted.key.participant ?? quoted.key.remoteJid,
                quotedMessage: quoted.message
            }
        }
        if (this.temp) {
            const message = await prepareWAMessageMedia(this.temp, { upload: this.sock.waUploadToServer })
            this.message.interactiveMessage.header = {
                ...message
            }
            this.message.interactiveMessage.header.hasMediaAttachment = true
        }

        return this.sock.relayMessage(jid, this.message, {
            additionalNodes: [
                {
                    tag: "biz",
                    attrs: {},
                    content: [
                        {
                            tag: "interactive",
                            attrs: {
                                type: "native_flow",
                                v: "1",
                            },
                            content: [
                                {
                                    tag: "native_flow",
                                    attrs: {
                                        v: "9",
                                        name: "mixed",
                                    },
                                },
                            ],
                        },
                    ],
                },
            ]
        })
    }

    /**
     * 
     * @param {string} title 
     * @param {AnyMediaMessageContent|string} anyMediaMessageContent
     * @returns {Interactive}
     */
    setHeader(anyMediaMessageContent) {
        if (typeof (anyMediaMessageContent) !== "string") {
            this.temp = anyMediaMessageContent
        }
        this.message.interactiveMessage.header.title = anyMediaMessageContent
        return this
    }

    /**
     * 
     * @param {string} text 
     * @returns {Interactive}
     */
    setBody(text) {
        this.message.interactiveMessage.body.text = text
        return this
    }

    /**
     * 
     * @param {string} text 
     * @returns {Interactive}
     */
    setFooter(text) {
        this.message.interactiveMessage.footer.text = text
        return this
    }

    /**
     * 
     * @param {string} displayText 
     * @param {string} copyCode 
     * @returns {Interactive}
     */
    addButtonCopy(displayText, copyCode) {
        this.message.interactiveMessage.nativeFlowMessage.buttons.push({
            name: "cta_copy",
            buttonParamsJson: JSON.stringify({
                display_text: displayText,
                copy_code: copyCode
            })
        },)
        return this
    }

    /**
     * 
     * @param {string} displayText 
     * @param {string} id 
     * @returns {Interactive}
     */
    addButtonQuickReply(displayText, id) {
        this.message.interactiveMessage.nativeFlowMessage.buttons.push({
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                "display_text": displayText,
                "id": id
            })
        },)
        return this
    }

    /**
     * @typedef {object} ButtonUrlOptions
     * @property {boolean} [webview_interaction]
     */

    /**
     * 
     * @param {string} displayText 
     * @param {string} url 
     * @param {ButtonUrlOptions} opts 
     * @returns {Interactive}
     */
    addButtonUrl(displayText, url, opts = {}) {
        const { webview_interaction = false } = opts
        this.message.interactiveMessage.nativeFlowMessage.buttons.push({
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
                display_text: displayText,
                url: url,
                webview_interaction
            })
        })
        return this
    }

    /**
     * @typedef {object} ButtonLimitOptions
     * @property {string} [listTitle]
     * @property {string} [buttonTitle]
     * @property {string[] | number[]} [deviderIndicies]
     */

    /**
     * 
     * @param {number | string} limit 
     * @param {ButtonLimitOptions} opts 
     * @returns {Interactive}
     */
    setButtonLimit(limit = 1, opts = {}) {
        const { listTitle = "action list", buttonTitle = "choose action", deviderIndicies = [] } = opts
        this.message.interactiveMessage.nativeFlowMessage.messageParamsJson = JSON.stringify({
            "bottom_sheet": {
                "in_thread_buttons_limit": limit,
                "divider_indices": deviderIndicies,
                "list_title": listTitle,
                "button_title": buttonTitle
            }
        })
        return this
    }


}

export { Interactive }

