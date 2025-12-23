


export function tag(lid) {
    return '@' + lid.split('@')[0]
}

export function textOnlyMessage(m) {
    const { message } = m
    return message?.conversation || message?.extendedTextMessage
}