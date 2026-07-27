import { stmtMessageContents } from "../database/table-message-contents.js";

/**
 * @import {MessageContentBase, MessageContentCache} from "../types/types.js"
 */

class ContentTypeStore {
    messageContentMap = new Map()
    constructor() {
        let counter = 0
        for (const row of stmtMessageContents.selectAll.iterate()) {
            const { id, content } = row
            this.messageContentMap.set(content, { id, content })
            counter++
        }
    }

    insertMessageContent(payload, bem, wam) {
        const { content, type } = payload
        const res = stmtMessageContents.insert.run({ content })
        const id = res.lastInsertRowid
        this.messageContentMap.set(content, { id, content })
        return { id, ...payload }
    }

    /**
     * 
     * @param {MessageContentBase} messageContentBase 
     * @param {*} bem 
     * @param {*} wam 
     * @returns {MessageContentCache}
     */
    getMessageContent(messageContentBase, bem, wam) {

        const { content, type } = messageContentBase
        if (!content) return

        const messageContent = this.messageContentMap.get(content)
        if (!messageContent) return this.insertMessageContent(messageContentBase, bem, wam)
        return { ...messageContent, type }
    }

    /**
     * 
     * @param {string|number|undefined} id 
     * @returns {MessageContentCache | undefined}
     */
    getContentById(id) {
        if(!id) return undefined
        return stmtMessageContents.getContentById.get({id})
    }
}

const contentTypeStore = new ContentTypeStore()

export { contentTypeStore }