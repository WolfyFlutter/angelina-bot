import { createSocket } from "./socket.js";
import { store } from "./store/store.js";

// event handler
import { handlerConnectionUpdate } from "./event-handler/connection.update.js";
import { handlerCredsUpdate } from "./event-handler/creds-update.js";
import { handlertMessagesUpsert } from "./event-handler/messages.upsert.js";

global.nodeMap = new Map()

const startSock = async () => {

    const sock = await createSocket()

    sock.ws.on(
        "CB:message",
        /** @param {import("baileys").BinaryNode} node */
        (node) => {
            global.nodeMap.set(node.attrs.id, {
                ...node,
                content: (node.content ?? []).filter( v => v.tag !== 'enc')
            })
        }
    )

    //sock.ws.on('frame', (node) => console.log(`node`, node))

    sock.ev.process(async (ev) => {
        // const { ["presence.update"]: tmp1, ["message-receipt.update"]: tmp2, ...rest } = ev
        // if (Object.keys(rest).length) {
        //     console.log(rest)
        // }

        store.bind(ev, sock)

        if (ev['creds.update']) {
            await handlerCredsUpdate(ev['creds.update'], sock)
        }

        if (ev['connection.update']) {
            await handlerConnectionUpdate(ev['connection.update'], sock, startSock)
        }

        if (ev['messages.upsert']) {
            await handlertMessagesUpsert(ev['messages.upsert'], sock)
        }
    })
}

await startSock()

