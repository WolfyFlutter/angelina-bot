export default function consoleMessage(m, q, store) {
    let pQuoted = ''
    let qsymbol = ''
    const separator = '\n'
    if (q) {
        const pQName = `[${q.pushName}] `
        const pQSenderId = `[${q.senderId}] `
        const pQType = `[${q.type}] `
        const pQText = `${q.text ? '\n' + q.text : ''}`
        pQuoted = '[Q] ' + pQName + pQType + pQSenderId + pQText + '\n'
        qsymbol = '⤷ '
    }
    const pChat = `${store.groupMetadata.get(m.chatId)?.subject || m.chatId} [${m.chatId}]\n`
    const pName = `[${m.pushName}] `
    const pSenderId = `[${m.senderId}] `
    const pType = `[${m.type}] `
    const pText = `${m.text ? '\n' + m.text : ''}`
    return pChat + pQuoted + qsymbol + '[M] ' + pName + pType + pSenderId + pText + separator
}