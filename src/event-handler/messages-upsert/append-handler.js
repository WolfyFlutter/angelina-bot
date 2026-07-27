import { printMessage } from "../../print-message.js"
import { messageSerialize } from "../../serializer/messages-serializer.js"
import { messageStore } from "../../store/message-store.js"
import { db } from "../../database/database.js"

const appendHandler = async (bem, sock) => {
    const { messages } = bem

    db.exec(`BEGIN TRANSACTION`)
    for (const WAM of messages) {
        const m = messageSerialize(WAM, sock)
        const messageIndex = messageStore.saveMessage(m)
        printMessage(m, {
            type: "append",
            messageIndex
        })
        global.nodeMap.delete(m.key.id)
    }
    db.exec(`COMMIT`)
}

export { appendHandler }