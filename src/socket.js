import makeWASocket, { fetchLatestWaWebVersion } from "baileys";

import { logger } from "./pino.js";

import { customAuth } from "./auth.js";

import { groupMetadataStore } from "./store/group-metadata-store.js";

import NodeCache from "@cacheable/node-cache";
const msgRetryCounterCache = new NodeCache()

/**@import {WASocket} from "baileys" */

/** return baileys socket
 * @return {Promise <import("baileys").WASocket>} */

const createSocket = async () => {

    // fetch latest version from wa web
    const { version, error } = await fetchLatestWaWebVersion()
    if (error) {
        console.error(`error fetch latest version baileys`, error)
    }

    const cachedGroupMetadata = (jid) => {
        return groupMetadataStore.getGroupMetadata(jid, sock)
    }

    // socket config
    const sock = makeWASocket({
        version,
        auth: customAuth.state,
        logger,
        cachedGroupMetadata,
        msgRetryCounterCache
    })
    return sock
}

export { createSocket }