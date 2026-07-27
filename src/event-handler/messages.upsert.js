import { notifyHandler } from "./messages-upsert/notify-handler.js"
import { appendHandler } from "./messages-upsert/append-handler.js"

/**
 * messages upsert handler
 * @param {import ("baileys").WASocket} sock 
 * @param {import ("baileys").BaileysEventMap['messages.upsert']} bem 
 */

const handlertMessagesUpsert = async (bem, sock) => {

    if (bem.type === "append") {
        await appendHandler(bem, sock)
    }
    else if (bem.type === "notify") {
        await notifyHandler(bem, sock)
    }
    else {
    }
}

export { handlertMessagesUpsert }