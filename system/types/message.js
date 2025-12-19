/**
 * @typedef {Object} BaseMessage
 * @property {string} chatId
 * @property {string} senderId
 * @property {string} pushName
 * @property {string | undefined} type
 * @property {string | undefined} text
 * @property {import('baileys').WAMessageKey} key
 * @property {import('baileys').WAMessageContent} message
 */

/**
 * @typedef {BaseMessage & {
 *   messageId: string,
 *   timestamp: number,
 *   q: QuotedMessage | undefined
 * }} Message
 */

/**
 * @typedef {BaseMessage} QuotedMessage
 */

export {};
