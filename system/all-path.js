import path from 'node:path'

const blockedJids = path.join(import.meta.dirname, '../user/data/blocked-jids.json')
const chatListenMode = path.join(import.meta.dirname, '../user/data/chat-listen-mode.json')
const groupWhitelist = path.join(import.meta.dirname, '../user/data/group-whitelist.json')
const prefix = path.join(import.meta.dirname, '../user/data/prefix.json')
const trustedJids = path.join(import.meta.dirname, '../user/data/trusted-jids.json')
const botInfo = path.join(import.meta.dirname, '../user/data/bot-info.json')
const tempFolder = path.join(import.meta.dirname, '../user/temp')



const baileysAuth = path.join(import.meta.dirname, '../auth')
const root = path.join(import.meta.dirname, '../')

const systemPlugins = path.join(import.meta.dirname, './plugins')
const userPlugins = path.join(import.meta.dirname, '../user/plugins')

const allPath = {
    blockedJids,
    chatListenMode,
    groupWhitelist,
    prefix,
    trustedJids,
    baileysAuth,
    botInfo,
    root,
    tempFolder,
    systemPlugins,
    userPlugins
}

export { allPath }