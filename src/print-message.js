/**
 * @import {MessageUpsertType} from "baileys"
 */

/**
 * @typedef {object} PrintMessageOptions
 * @property {MessageUpsertType} type
 * @property {string|number} [messageIndex]
 */


import { humanTimeFromSecond } from "./helper/common.js"

const idk = '~unknown'

/**
 * @import {messageSerialize} from "./types/types.js"
 * @param {messageSerialize} m 
 * @param {PrintMessageOptions} opts
 */
const printMessage = (m, opts) => {
  const { type, messageIndex = 'unsaved' } = opts ?? {}
  const header =
    `${type === "notify" ? `🔊` : `🔈`} ${type} [${messageIndex}]
🕒 ${m?.messageTimestamp ? humanTimeFromSecond(m?.messageTimestamp) : idk}
⛺ ${m?.chat?.name ?? idk} [${m?.chat?.id}]
`
  const main = `👤 ${m?.contact?.name ?? idk} [${m?.contact?.id}]
✉️ ${m?.contentType?.content ? `${m.contentType.content} [${m.contentType.id}]` : idk}
${m?.text ? m.text + '\n' : ''}`

  let quoted = ''
  if (m?.q) {
    quoted = `  👤 ${m?.q?.contact?.name ?? idk} [${m?.q?.contact?.id}]
  ✉️ ${m?.q?.contentType?.content ? `${m?.q?.contentType?.content} [${m?.q?.contentType.id}]` : idk}
${m?.q?.text ? m.q.text + '\n🔺' : '🔺'}
`
  }

  console.log(header + quoted + main, m)
}

export { printMessage }