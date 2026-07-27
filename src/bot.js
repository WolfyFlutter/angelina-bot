import { createSocket } from "./socket.js";
import { customAuth } from "./auth.js";

// event handler
import { handlerCredsUpdate } from "./event-handler/creds-update.js";
import { handlerConnectionUpdate } from "./event-handler/connection.update.js";
import { handlertMessagesUpsert } from "./event-handler/messages.upsert.js";
//import { handlerMessagingHistorySet } from "./event-handler/messaging-history.set.js";

// global debug
import { db } from "./database/database.js";
import { groupMetadataStore } from "./store/group-metadata-store.js";
import { memberLabelStore } from "./store/member-label-store.js";

// manager
import { prefixManager } from "./manager/prefix-manager.js";
import { pluginManager } from "./manager/plugin-manager.js";
import { menuManager } from "./manager/menu-manager.js";
import { pluginAccessManager } from "./manager/plugin-access-manager.js";
import { themeManager } from "./manager/theme-manager.js";

// global store
import { store } from "./store/store.js";
import { contactStore } from "./store/contact-store.js";
import { messageStore } from "./store/message-store.js";
import { contentTypeStore } from "./store/content-type-store.js";

// helper
import * as commonHelper from "./helper/common.js"

// config
import { config } from "./config.js";


// for testing
global._ = {
    prefixManager,
    pluginManager,
    menuManager,
    pluginAccessManager,
    themeManager,

    config,

    // debug
    //pluginAccessManager2,


    store,

    db,
    groupMetadataStore,
    memberLabelStore,
    contactStore,
    messageStore,
    contentTypeStore,

    commonHelper
}

global.GC_ANGELINA = "120363423077197619@g.us"

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
        const { ["presence.update"]: tmp1, ["message-receipt.update"]: tmp2, ...rest } = ev
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

    global._.sock = sock
}

await startSock()

