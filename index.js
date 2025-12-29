// external lib import
import makeWASocket, {
    makeCacheableSignalKeyStore,
    useMultiFileAuthState,
    DisconnectReason,
    jidNormalizedUser,
    fetchLatestWaWebVersion,
    delay,
    isJidGroup,
    areJidsSameUser,
    proto,
} from "baileys";
import P from 'pino'
import NodeCache from '@cacheable/node-cache';
import qrTerminal from 'qrcode-terminal'

// node js import
import readline from 'node:readline'
import fs from 'node:fs'
import path from 'node:path'

// local import
import * as wawa from '#helper'
import { allPath, msToReadableTime, sendText, safeRunAsync } from './system/helper.js'
import patchMessageBeforeSending from "./system/patch-message-before-send.js";
import UserManager from './system/manager-user.js'
import PrefixManager from './system/manager-prefix.js'
import PluginManager from './system/manager-plugin.js'

// handler import
import messageUpsertHandler from "./system/handler/message-upsert.js";
import presenceUpdate from "./system/handler/presence-update.js";

// object create
const msgRetryCounterCache = new NodeCache();
const userManager = new UserManager();
const prefixManager = new PrefixManager()
const pluginManager = new PluginManager()

// object create store
const groupMetadata = new Map()
const contacts = new Map()

let sock // = makeWASocket({})

const bot = {
    pn: null,
    lid: null,
    pushname: null,
    log: true
};

let gotCode = false;



//nitiip
const consoleStream = {
    write: (msg) => {
        try {
            const obj = JSON.parse(msg)
            console.log('pino', obj)
        } catch (e) {
            console.error('non-json log:', msg)
        }
    }
}
const logger = P({ level: "error" })

const getGroupMetadata = async (jid) => {

    let data = groupMetadata.get(jid)
    if (!data) {
        try {
            const fresh = await sock.groupMetadata(jid)
            console.log(`↗️ fetch group metadata: ${fresh.subject}`)
            groupMetadata.set(jid, fresh)
            return fresh
        } catch (error) {
            console.error(`gagal fetch group metadata: ${jid}`, error)
            return undefined
        }
    } else {
        console.log(`♻️ cache: ${data.subject}`)
        return data
    }

    // return this.antri.run(jid, async () => {

    // })
}

const store = {
    groupMetadata,
    contacts,
    getGroupMetadata
}


// #GLOBAL VARIABLE NANTI DI HAPUS, INI UNTUK DEBUGINGS
// global.prefix = prefixManager
// global.user = userManager
// global.bot = bot;
// global.store = store;
// global.pm = pluginManager
// global.fs = fs
// global.msgRetryCounterCache = msgRetryCounterCache
// global.helper = wawa

const { saveCreds, state } = await useMultiFileAuthState(allPath.baileysAuth);
const { version } = await fetchLatestWaWebVersion()

const init = async () => {
    await pluginManager.loadPlugins()
    pluginManager.buildMenu()
}

const startSock = async function (opts = {}) {
    console.log("✔️ fungsi startSock di panggil");
    sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            /** caching makes the store faster to send/recv messages */
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        msgRetryCounterCache,
        cachedGroupMetadata: store.getGroupMetadata,
        logger,
        patchMessageBeforeSending,
        syncFullHistory: false,
        shouldSyncHistoryMessage: msg => {
            //console.log("should sycn history message", msg)
            return false
        },
    });

    sock.ev.process(async (ev) => {
        // if (ev['presence.update'] || ev['message-receipt.update'] || ev['creds.update'] || ev['connection.update']) {
        //     // console.log(ev)

        // } else {
        //     if (bot.log) console.log(ev)
        // }

        // console.log(ev)

        // handle koneksi
        if (ev["connection.update"]) {
            const update = ev["connection.update"];
            const { connection, lastDisconnect, qr, isOnline } = update;

            if (connection == "close") {
                console.log("❌ koneksi tertutup");

                // logic logout
                const logoutByUser = lastDisconnect?.error?.output?.statusCode == DisconnectReason.loggedOut;
                if (logoutByUser) {
                    if (fs.existsSync(allPath.baileysAuth)) {
                        fs.rmSync(allPath.baileysAuth, {
                            recursive: true,
                            force: true,
                        });
                        console.log("logout by user or uncompleted pairing. auth folder deleted. program stopped (please wait)");

                        // restart to launcher
                        process.exitCode = 69
                        process.exit()
                    }

                }

                // logic handling connection closed
                else {
                    sock.ev.removeAllListeners()
                    sock.ws.close()
                    sock = null
                    await delay(5000)
                    startSock()
                }
            }

            else if (connection == "open") {
                console.log("✅ terhubung ke whatsapp");

                // read last restart messafe (if any)
                const lastRestartMessage = path.join(allPath.tempFolder, 'message-restart.bin')
                const result = await safeRunAsync(fs.promises.readFile, lastRestartMessage)
                if (result.ok) {
                    console.log('found last restart message.. sending.. iam reincarnation')
                    const wm = proto.WebMessageInfo.decode(result.data)
                    await sock.sendMessage(wm.key.remoteJid, { text: `hey i born again! with pid: ${process.pid}` }, { quoted: wm })
                    await fs.promises.rm(lastRestartMessage)
                }
            }

            else if (connection == "connecting") {
                console.log("🔃 menghubungkan ke whatsapp");
            }

            else if (qr) {
                // qr print
                if (opts.qr) {
                    qrTerminal.generate(qr, { small: true })
                }

                // logic pairing code
                if (!gotCode && opts.pn) {
                    console.log(`please wait, sending login code to ${allPath.botNumber}`);
                    const code = await sock.requestPairingCode(opts.pn, 'SEXYWOLF');
                    console.log(`code ${code.match(/.{4}/g).join("-")}`);
                    gotCode = true;
                }
            }

            else if (isOnline) {
                console.log("🟢 online")


            }
        }

        // handle kredensial
        if (ev["creds.update"]) {
            const bem = ev["creds.update"];

            if (bem.me?.id && bem.me?.lid) {
                bot.pushname = bem.me?.name || 'sexy bot';
                bot.pn = jidNormalizedUser(bem.me.id);
                bot.lid = jidNormalizedUser(bem.me.lid);

                const obj = {
                    notify: bot.pushname,
                    verifiedName: undefined,
                };

                contacts.set(bot.pn, obj)
                contacts.set(bot.lid, obj)

            }
            await saveCreds();
        }

        // [push name]
        if (ev['contacts.update']) {
            const bem = ev['contacts.update']
            for (let i = 0; i < bem.length; i++) {
                const partialUpdate = bem[i]
                const { id, ...rest } = partialUpdate
                contacts.set(id, rest)
            }
        }

        // [groupMetadata] 
        if (ev['groups.update']) {
            const bem = ev['groups.update']
            for (let i = 0; i < bem.length; i++) {
                const partialUpdate = bem[i] //bem (baileys event map), karena bentukan array jadi musti di ambil 1 1
                const jid = partialUpdate.id // simpen dulu current jid nyah
                const current = await getGroupMetadata(jid) //ambil dulu grup matadata current jid
                if (current) Object.assign(current, partialUpdate)

            }
        }

        // [groupMetadata] [chat]
        if (ev['groups.upsert']) {
            const bem = ev['groups.upsert']
            for (let i = 0; i < bem.length; i++) {
                const newGroupMetaData = bem[i] //bem (baileys event map), karena bentukan array jadi musti di ambil 1 1
                const jid = newGroupMetaData.id // simpen dulu current jid nyah
                groupMetadata.set(jid, newGroupMetaData) //simpen data baru ke store
            }
        }

        // [groupMetadata]
        if (ev['group-participants.update']) {
            const bem = ev['group-participants.update']
            const action = bem.action
            const jid = bem.id
            const selectedParticipants = bem.participants

            const promoteDemote = async (participantsArray, nullOrAdmin) => {
                const current = await getGroupMetadata(jid)
                if (!current) return
                for (let i = 0; i < participantsArray.length; i++) {
                    const newParticipant = participantsArray[i]
                    const find = current.participants.find(cp => cp.id == newParticipant.id)
                    const newParticipantData = {
                        //id: newParticipant.id,
                        admin: nullOrAdmin
                    }

                    if (find) {
                        Object.assign(find, newParticipantData)
                    } else {
                        current.participants.push(newParticipantData)
                    }
                }
            }

            const remove = async (participantsArray, gMetadata, gMetadataJid) => {
                const isBotKicked = participantsArray.some(p => areJidsSameUser(p.id, bot.lid))
                if (isBotKicked) {
                    console.log('bot kicked from group')
                    gMetadata.delete(gMetadataJid)
                } else {
                    const current = await getGroupMetadata(gMetadataJid)
                    if (!current) return
                    participantsArray.forEach(kickedParticipant => {
                        const idx = current.participants.findIndex(p => p.id == kickedParticipant.id)
                        if (idx != -1) {
                            current.participants.splice(idx, 1)
                        }
                    })
                    current.size = current.participants.length
                }
            }

            const add = async (participantsArray) => {
                const current = await getGroupMetadata(jid)
                if (!current) return

                for (let i = 0; i < participantsArray.length; i++) {
                    const newParticipant = participantsArray[i]
                    const find = current.participants.find(cp => cp.id == newParticipant.id)
                    if (!find) {
                        current.participants.push({
                            id: newParticipant.id,
                            lid: undefined,
                            phoneNumber: newParticipant.phoneNumber,
                            admin: null
                        })
                    }
                }
                current.size = current.participants.length
            }

            switch (action) {
                case 'add':
                    await add(selectedParticipants)
                    break
                case 'promote':
                    await promoteDemote(selectedParticipants, 'admin')
                    break
                case 'demote':
                    await promoteDemote(selectedParticipants, null)
                    break
                case 'remove':
                    await remove(selectedParticipants, groupMetadata, jid)
                    break
                case 'modify':
                    console.log('modify', bem)
                    break
            }
        }

        // [groupMetadata] [chat]
        if (ev['chats.update']) {
            const bem = ev['chats.update']
            for (let i = 0; i < bem.length; i++) {
                const partialUpdate = bem[i] //bem (baileys event map), karena bentukan array jadi musti di ambil 1 1
                const jid = partialUpdate.id // simpen dulu current jid nyah

                // update ephemeral ke store grup
                if (isJidGroup(jid)) {
                    if (!partialUpdate.hasOwnProperty('ephemeralExpiration')) continue
                    const value = partialUpdate.ephemeralExpiration || undefined
                    const ephemUpdate = { ephemeralDuration: value }
                    const current = await getGroupMetadata(jid) //ambil dulu grup matadata current jid

                    Object.assign(current, ephemUpdate)
                    console.log('group ephemeral update', ephemUpdate)
                }
            }
        }

        if (ev['messages.upsert']) {
            await messageUpsertHandler(sock, ev['messages.upsert'])
        }


        if (ev['presence.update']) {
            await presenceUpdate(sock, ev['presence.update'])
        }
    });

    // if (global.sock) delete global.sock
    // global.sock = sock
}


// IPC
process.on('message', async (message) => {
    if (message.type === 'uptime') {
        const print = msToReadableTime(message.data.uptime * 1000)
        const jid = message.data.jid
        await sendText(sock, jid, print)
    }
})

export { pluginManager, prefixManager, userManager, store, bot }






// handling init
const credsPath = path.join(import.meta.dirname, 'auth/creds.json')
const credsExist = await safeRunAsync(fs.promises.access, credsPath)
if (!credsExist.ok) {
    console.log('no creds found. starting new login')
    // interface
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

    const loginMethod = ['1', '2', '3']
    let userLoginMethod
    let valid
    let botPhoneNumber
    do {
        const question = `select your login method:\n1. pairing code\n2. qr scan\n3. nevermind\ntype number only > `
        userLoginMethod = await ask(question)
        valid = loginMethod.includes(userLoginMethod)
        if (!valid) console.log(`${userLoginMethod} is invalid try again\n`)
    } while (!valid)

    if (userLoginMethod === loginMethod[0]) {
        const question = `enter bot's phone number (6281xxx) or type exit to exit :\n type > `
        botPhoneNumber = await ask(question)
        if (botPhoneNumber === 'exit') {
            console.log('bye!')
            process.exit()
        }
        init()
        startSock({ pn: botPhoneNumber })
    } else if (userLoginMethod === loginMethod[1]) {
        init()
        startSock({ qr: true })
    } else if (userLoginMethod === loginMethod[2]) {
        console.log('bai bai')
    }

    rl.close()
    console.log('readline closed')

} else {
    console.log('start bot as usual')
    init()
    startSock()
}
