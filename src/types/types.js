
/**
 * @import {pluginAccessManager} from "../manager/plugin-access-manager.js"
 * @import {prefixManager} from "../manager/prefix-manager.js"
 * @import {pluginManager} from "../manager/plugin-manager.js"
 * @import {menuManager} from "../manager/menu-manager.js"
 * @import {themeManager} from "../manager/theme-manager.js"
 * 
 * @import {db} from "../database/database.js"
 * @import {contactStore} from "../store/contact-store.js"
 * @import {memberLabelStore} from "../store/member-label-store.js"
 * @import {messageStore} from "../store/message-store.js"
 * @import {groupMetadataStore} from "../store/group-metadata-store.js"
 * @import {contentTypeStore} "../store/content-type-store.js"
 * 
 * @import {WAMessage, WAMessageKey, WASocket, proto} from "baileys"
 * @import {Stream} from "node:stream" */

/**
 * @typedef {object} groupKeyMessage
 * @property {string|undefined} admin
 * @property {string|undefined} label
 */

/**
 * ini outputnya, yg konsisten cuma variabel kind, id dan displayText, untuk description dan index itu kadang ada kadang undefined
 * @typedef {object} buttonSerialize button serialized
 * @property {string} kind jenis button nya, biasanya. liat aja kode di bawah
 * @property {string} id ini biasanya yang kalian gunakan untuk deteksi command
 * @property {string} displayText teks yang muncul di chat wacap
 * @property {string | undefined} description deskripsi button
 * @property {number | undefined} index index, biasanya muncul pas tipe button quick_reply
 */

/**
 * @typedef {WAMessage & {
 * isGroup: Boolean
 * isPrivate: Boolean
 * chat: ContactCache | undefined,
 * contact: ContactCache | undefined,
 * group: groupKeyMessage | undefined,
 * contentType: MessageContentCache
 * content: keyof proto.IMessage,
 * text: string | undefined,
 * sender: string | undefined,
 * download: Promise <Buffer | Stream.Transform>,
 * react: Promise <WAMessage| undefined>,
 * reply: Promise <WAMessage | undefined>,
 * button?: buttonSerialize | undefined,
 * q?: messageSerialize | undefined
 * }} messageSerialize
 */

/**
 * @typedef {object} PluginConfig
 * @property {Boolean} [bypassPrefix] kalau true maka plugin gk perlu prefix (walaupun prefix on) biasanya plugin eval dan shell
 * @property {Boolean} [protected] kalau true maka plugin gak bisa di hapus, biasanya plugin core punya ini
 * @property {Boolean} [removeFirstUrl] set true kalau hentak ingin sisipkan url di deskripsi atau di author note, dan isikan key url pada meta plugin
 * @property {Boolean} [bypassLock] set true kalau command mau bypass lock, biasanya ini cuma untuk fitur lock / unlock
 */

/**
 * @typedef {object} PluginCtx
 * @property {WASocket} sock,
 * @property {WAMessageKey['remoteJid']} jid,
 * @property {messageSerialize} m,
 * @property {messageSerialize | undefined} q,
 * @property {string | undefined} text,
 * @property {string | undefined} prefix,
 * @property {string | undefined} command
 * @property {typeof pluginManager} pluginManager
 * @property {typeof menuManager} menuManager
 * @property {typeof prefixManager} prefixManager
 * @property {typeof pluginAccessManager} pluginAccessManager
 * @property {typeof themeManager} themeManager
 * @property {typeof contactStore} contactStore
 * @property {typeof memberLabelStore} memberLabelStore
 * @property {typeof groupMetadataStore} groupMetadataStore
 * @property {typeof messageStore} messageStore
 * @property {typeof contentTypeStore} contentTypeStore
 * @property {typeof db} db
 */

/**
 * @typedef {object} pluginMeta
 * @property {string} fileName filename dari plugin. misal ping.js
 * @property {string|undefined} author nama pembuat plugin / yang rawat plugin nya
 * @property {string|undefined} note catatan gabut author plugin
 * @property {string} version catatan version plugin, bebas aja
 * @property {string} [url] url buat help, kadang isi kadang engga
 */

/**
 * @typedef {object} Plugin
 * @property {Promise<any>} run fungsi utama, menerima param pluginCtx
 * @property {string} name nama plugin
 * @property {string} id plugin id untuk database. gak boleh sama value nya dengan plugin lainnya
 * @property {[string]} commands array command
 * @property {[string]} categories array kategory
 * @property {string | undefined} description deskripsi plugin
 * @property {pluginMeta} meta plugin metadata untuk install / share plugin
 * @property {PluginConfig} [config] additional plugin config
 * @property {string} path path absolute lokasi plugin
 */


/**
 * @typedef {object} CommonResponseOld
 * @property {boolean} ok
 * @property {string|undefined} message
 */


/**
 * @typedef {"install" | "fail" | "replace"} PluginVerifikatorStatus
 */

/**
 * @typedef {object} PluginVerifikatorResponse
 * @property {PluginVerifikatorStatus} status
 * @property {string|undefined} message
 */

/**
 * @typedef {object} PrefixResult
 * @property {boolean} ok true kalau match prefix, false kalau gak match prefix, kalau prefix off maka akan selalu true
 * @property {string|undefined} prefix berisikan string prefix yang benar dari salah satu list, hasil menyesuaikan, bisa undefined
 * @property {string|undefined} data adalah teks yang sudah di hapus prefix nya, [].halo] menjadi [halo], [. halo] menjadi [ halo]
 */

/**
 * @typedef {Object} PrefixStatus
 * @property {boolean} isPrefixActive
 * @property {string[]} prefixList
 */


/**
 * @typedef {object} FirstStringAndRestResponse reponse
 * @property {string|undefined} firstString - kata pertama yang berhasil di ambil, misal |halo wolep|, first = wolep
 * @property {string|undefined} restString - sisa kata setelah first, misal, |halo wolep|, rest = | wolep|
 */




/**
 * @template T
 * @typedef {object} CommonResponse
 * @property {string} [error] - error message
 * @property {T} [data] data
 */

/**
 * @typedef {"grant" | "revoke" | "view" | "nuke" | "drop"} PAMSubcommand
 */

/**
 * @typedef {object} PAMSerialize
 * @property {PAMSubcommand} subCommand subcommand
 * @property {string} groupJid grup jid
 * @property {string} authorLid author lid
 * @property {string} participantLid participant lid
 * @property {number} timestamp timestamp
 * @property {string[]|undefined} pluginCommands pluginCommands
 * @property {string|undefined} error error
 * @property {string|undefined} restString
 */

/**
 * @typedef {object} ContactBase
 * @property {string} primaryId lid, atau lainnya, pn jangan masuk sini
 * @property {string} [secondaryId] biasanya ini isi pn
 * @property {string} [name] nama
 * @property {number} [updatedAt] timestamp second
 */

/**
 * @typedef {object} ContactCache
 * @property {number} id - id dari database
 * @property {string} primaryId - lid atau lainnya
 * @property {string} primaryServer - server text
 * @property {string|undefined} name
 * @property {string|undefined} secondaryId biasanya isi lid
 */

/**
 * @typedef {object} MessageContentBase
 * @property {keyof proto.IMessage} content
 * @property {number|undefined} type
 */

/**
 * @typedef {object} MessageContentCache
 * @property {number} id
 * @property {keyof proto.IMessage} content
 * @property {number|undefined} type
 */


export { }