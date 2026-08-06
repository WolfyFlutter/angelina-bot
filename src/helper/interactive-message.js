import { prepareWAMessageMedia } from "baileys"

/**
 * @import { WASocket, WAMessageContent, AnyMediaMessageContent} from "baileys"
 */

/**
 * @typedef {"PROMOTION" | "DEFAULT" | "REVIEW" | "DOCUMENT"} Icon
 */


class InteractiveMessage {
    /**@type {WAMessageContent} */
    #message = {
        interactiveMessage: {
            header: {},
            body: {
                text: ''
            },
            footer: {},
            nativeFlowMessage: {
                buttons: [],
                messageParamsJson: null,
            },
        }
    }
    #sock

    /**
     * @type {AnyMediaMessageContent}
     */
    #tempAnyMessageContent

    /**
     * bind socket dulu cuy
     * @param {WASocket} sock 
     */
    constructor(sock) {
        this.#sock = sock
    }

    /**
     * set text
     * @param {string} text 
     * @returns {InteractiveMessage}
     */
    setTitle(text) {
        if (typeof text !== "string") throw Error(`input harus string`)
        this.#message.interactiveMessage.header.title = text
        return this
    }

    /**
     * set subtitle, biasanya muncul di waweb, di hp gak muncul
     * @param {string} text 
     * @returns {InteractiveMessage}
     */
    setSubtitle(text) {
        if (typeof text !== "string") throw Error(`input harus string`)
        this.#message.interactiveMessage.header.subtitle = text
        return this
    }

    /**
     * set footer
     * @param {string} text 
     * @returns {InteractiveMessage}
     */
    setFooter(text) {
        if (typeof text !== "string") throw Error(`input harus string`)
        this.#message.interactiveMessage.footer.text = text
        return this
    }

    /**
     * set body text
     * @param {string} text 
     * @returns {InteractiveMessage}
     */
    setBody(text) {
        if (typeof text !== "string") throw Error(`input harus string`)
        this.#message.interactiveMessage.body.text = text
        return this
    }

    /**
     * wip
     * @param {AnyMediaMessageContent} anyMessageContent 
     * @returns {InteractiveMessage}
     */
    setMedia(anyMessageContent) {
        this.#tempAnyMessageContent = anyMessageContent
        return this
    }

    /**
    * @typedef {object} ButtonUrlOptions
    * @property {boolean} [webview_interaction]
    * @property {Icon} [icon]
    */

    /**
     * 
     * @param {string} displayText 
     * @param {string} url 
     * @param {ButtonUrlOptions} opts 
     * @returns {InteractiveMessage}
     */
    addButtonUrl(displayText, url, opts) {
        if (typeof displayText !== "string") throw Error(`displayText harus string`)
        if (typeof url !== "string") throw Error(`url harus string`)

        const { webview_interaction = undefined, icon = undefined } = opts ?? {}
        this.#message.interactiveMessage.nativeFlowMessage.buttons.push({
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
                display_text: displayText,
                url: url,
                webview_interaction,
                icon
            })
        })
        return this
    }

    /**
     * @typedef {object} ButtonQuickReplyOption
     * @property {Icon} [icon]
     */

    /**
     * 
     * @param {string} displayText 
     * @param {string} id
     * @param {ButtonQuickReplyOption} [opts] 
     * @returns {InteractiveMessage}
     */
    addButtonQuickReply(displayText, id, opts) {
        if (typeof displayText !== "string") throw Error(`displayText harus string`)
        if (typeof id !== "string") throw Error(`id harus string`)
        const { icon } = opts ?? {}
        this.#message.interactiveMessage.nativeFlowMessage.buttons.push({
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                "display_text": displayText,
                "id": id,
                icon
            })
        },)
        return this
    }

     /**
     * @typedef {object} ButtonCopyOptions
     * @property {Icon} [icon]
     */

    /**
     * 
     * @param {string} displayText 
     * @param {string} copyCode 
     * @param {ButtonCopyOptions} [opts]
     * @returns {InteractiveMessage}
     */
    addButtonCopy(displayText, copyCode, opts) {
        if (typeof displayText !== "string") throw Error(`displayText harus string`)
        if (typeof copyCode !== "string") throw Error(`copycode harus string`)
        const { icon } = opts ?? {}
        this.#message.interactiveMessage.nativeFlowMessage.buttons.push({
            name: "cta_copy",
            buttonParamsJson: JSON.stringify({
                display_text: displayText,
                copy_code: copyCode,
                icon
            })
        },)
        return this
    }

    /**
     * @typedef {object} SingleSelectOptions
     * @property {Icon} [icon]
     */

    /**
     * 
     * @param {string} title 
     * @param {SingleSelectSection[]} sections 
     * @param {SingleSelectOptions} opts
     * @returns {InteractiveMessage}
     */
    addButtonSingleSelect(title, sections, opts) {
        const { icon = undefined } = opts || {}
        this.#message.interactiveMessage.nativeFlowMessage.buttons.push({
            name: 'single_select',
            buttonParamsJson: JSON.stringify({
                title: title,
                sections: sections,
                icon
            })
        })
        return this
    }

    /**
     * @typedef {object} ButtonLimitOptions
     * @property {string} [listTitle]
     * @property {string} [buttonTitle]
     * @property {string[] | number[] | "all"} [dividerIndicies]
     */

    /**
     * 
     * @param {number | string} limit 
     * @param {ButtonLimitOptions} opts 
     * @returns {InteractiveMessage}
     */
    setButtonLimit(limit = 1, opts = {}) {
        let { listTitle = "action list", buttonTitle = "choose action", dividerIndicies = [] } = opts

        if (dividerIndicies === "all") {
            dividerIndicies = Array.from({ length: this.#message.interactiveMessage.nativeFlowMessage.buttons.length }, (v, i) => i + 1)
        }

        this.#message.interactiveMessage.nativeFlowMessage.messageParamsJson = JSON.stringify({
            "bottom_sheet": {
                "in_thread_buttons_limit": limit,
                "divider_indices": dividerIndicies,
                "list_title": listTitle,
                "button_title": buttonTitle
            }
        })
        return this
    }

    async sendTo(jid) {

        /**@type {WAMessageContent} */
        let media
        if (this.#tempAnyMessageContent) {
            if (!this.#tempAnyMessageContent.image
                && !this.#tempAnyMessageContent.video
                && !this.#tempAnyMessageContent.document
            ) throw Error(`image / video / document only`)
            media = await prepareWAMessageMedia(this.#tempAnyMessageContent, {
                upload: this.#sock.waUploadToServer
            })
            this.#message.interactiveMessage.header.hasMediaAttachment = true
        }
        this.#message.interactiveMessage.header = { ...this.#message.interactiveMessage.header, ...media }

        return this.#sock.relayMessage(jid, this.#message, {
            additionalNodes: [
                {
                    tag: "biz",
                    attrs: {},
                    content: [{
                        tag: "interactive",
                        attrs: { type: "native_flow", v: "1", },
                        content: [{
                            tag: "native_flow",
                            attrs: { v: "9", name: "mixed" }
                        },
                        ],
                    }],
                },
            ]
        })
    }


}

/**
 * @typedef {object} SingleSelectSectionRow
 * @property {string} title 
 * @property {string} description 
 * @property {string} id 
 */


/**
 * @typedef {object} SingleSelectSection
 * @property {string} title
 * @property {string} [highlight_label]
 * @property {SingleSelectSectionRow[]} rows
 */


export { InteractiveMessage }