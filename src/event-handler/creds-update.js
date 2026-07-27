import { customAuth } from '../auth.js'
import { jidNormalizedUser } from 'baileys'

import { contactStore } from '../store/contact-store.js'

/**
 * 
 * @param {import ('baileys').BaileysEventMap['creds.update']} bem 
 * @param {import ('baileys').WASocket} sock 
 * @returns {Promise<undefined>}
 */
const handlerCredsUpdate = async (bem, sock) => {
    await customAuth.saveCreds()

    // kode ini untuk menambahkan kontak bot ke cache dan database
    if (Object.keys(bem).length === 1) {
        if (bem.me) {
            const { lid, id, name } = bem.me

            contactStore.upsertAndGetContact({
                primaryId: jidNormalizedUser(lid),
                secondaryId: jidNormalizedUser(id),
                name: name
            })
        }
    }
}

export { handlerCredsUpdate }