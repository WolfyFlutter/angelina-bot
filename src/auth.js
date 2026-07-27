import { makeCacheableSignalKeyStore, useMultiFileAuthState } from "baileys";
import { allPaths } from "./all-paths.js";

/**
 * todo : buat custom auth
 * @param {string} folderPath folder path for store auth
 * @returns {Promise <
 * {
 * state: import("baileys").AuthenticationState,
 * saveCreds: () => Promise<void>
 * }}
 */

const auth = async (folderPath) => {
    const { saveCreds, state: _state } = await useMultiFileAuthState(folderPath)
    const state = {
        keys : makeCacheableSignalKeyStore(_state.keys),
        creds : _state.creds
    }
    return { saveCreds, state }
}

const customAuth = await auth(allPaths.baileysAuth)

export { customAuth }