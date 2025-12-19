// external lib import
import makeWASocket, {
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  Browsers,
  DisconnectReason,
  jidNormalizedUser,
  fetchLatestWaWebVersion,
  delay,
  isJidGroup,
  areJidsSameUser
} from "baileys";
import P from 'pino'
import NodeCache from '@cacheable/node-cache';

// node js import
import readline from 'node:readline'
import fs from 'node:fs'
import path from 'node:path'

// local import
import { safeRun, consoleMessage, getErrorLine, sendText, pluginHelpSerialize, loadJson } from './system/helper.js'
import UserManager, { Permission } from './system/user-manager.js'
import PrefixManager from './system/prefix-manager.js'
import PluginManager from './system/plugin-manager.js'
import allPath from "./system/all-path.js";
import patchMessageBeforeSending from "./system/patch-message-before-send.js";
import serialize from "./system/serialize.js";

const prefixManager = new PrefixManager()
const pluginManager = new PluginManager()
if(prefixManager.isEnable) pluginManager.prefix = prefixManager.prefixList[0]
pluginManager.buildMenu()

const msgRetryCounterCache = new NodeCache();
const user = new UserManager();

let sock //= makeWASocket({})
const groupMetadata = new Map()
const contacts = new Map()

const bot = {
  pn: null,
  lid: null,
  pushname: null,
  displayName: null,
  bulletin1: null,
  bulletin2: null
};
const botInfo = loadJson(allPath.botInfo)
Object.assign(bot, botInfo)

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



const { saveCreds, state } = await useMultiFileAuthState(allPath.baileysAuth);
const { version } = await fetchLatestWaWebVersion()

// fungsi titip
// const updateChats = (jid, partialUpdate) => {
//   log('chat update', partialUpdate)

//   // checking file exist or no
//   const filePath = allPath.storeChatsPath + '/' + jid + '.json'
//   const exist = fs.existsSync(filePath)

//   if (!exist) { // if file is not exist. create new one save to ram and file
//     saveJson(partialUpdate, filePath)
//     this.chats.set(jid, partialUpdate)
//   } else { // if file exist, just update data in memory and save to file
//     const currentData = this.chats.get(jid)
//     const updatedJson = Object.assign(currentData, partialUpdate)
//     this.chats.set(jid, updatedJson)
//     saveJson(updatedJson, filePath)
//   }
// }

const getGroupMetadata = async (jid) => {

  let data = groupMetadata.get(jid)
  if (!data) {
    try {
      const fresh = await sock.groupMetadata(jid)
      console.log(`↗️ fetch group metadata: ${fresh.subject}`, fresh)
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


// #GLOBAL VARIABLE
global.user = user
global.bot = bot;
global.store = store;
global.pm = pluginManager
global.fs = fs
global.msgRetryCounterCache = msgRetryCounterCache


const startSock = async function (opts = {}) {
  await pluginManager.loadPlugins()

  console.log("▶️ fungsi startSock di panggil");

  sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      /** caching makes the store faster to send/recv messages */
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    browser: Browsers.windows("Chrome"),
    msgRetryCounterCache,
    cachedGroupMetadata: store.getGroupMetadata,
    logger,
    patchMessageBeforeSending,
    syncFullHistory: false,
    shouldSyncHistoryMessage: msg => {
      console.log("should sycn history message", msg)
      return false
    },
  });

  sock.ev.process(async (ev) => {
    // handle koneksi
    if (ev["connection.update"]) {
      const update = ev["connection.update"];
      const { connection, lastDisconnect, qr } = update;

      if (connection == "close") {
        console.log("❌ koneksi tertutup");

        // kalau logout by user, hapus auth folder
        const logoutByUser =
          lastDisconnect?.error?.output?.statusCode ==
          DisconnectReason.loggedOut;
        if (logoutByUser) {
          if (fs.existsSync(allPath.baileysAuth)) {
            fs.rmSync(allPath.baileysAuth, {
              recursive: true,
              force: true,
            });
            console.log(
              "logout by user or uncompleted pairing. auth folder deleted. program stopped (please wait)",
            );

          }
        } else {
          // or for whatever reason sock connection close.. just restart socket
          sock.end()
          await delay(5000)
          startSock()

        }
      } else if (connection == "open") {
        console.log("✅ terhubung ke whatsapp");
      } else if (connection == "connecting") {
        console.log("🔃 menghubungkan ke whatsapp");
      }

      // pairing code
      else if (qr) {
        if (opts.qr) {
          console.log(qr);
        }
        if (!gotCode && opts.pn) {
          //console.log(`please wait, sending login code to ${allPath.botNumber}`);
          const code = await sock.requestPairingCode(opts.pn, 'QQQQQQQQ');
          console.log(`code ${code.match(/.{4}/g).join("-")}`);
          gotCode = true;
        }
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

    // [groupMetadata] [chats]
    if (ev['groups.upsert']) {
      const bem = ev['groups.upsert']
      for (let i = 0; i < bem.length; i++) {
        const newGroupMetaData = bem[i] //bem (baileys event map), karena bentukan array jadi musti di ambil 1 1
        const jid = newGroupMetaData.id // simpen dulu current jid nyah
        groupMetadata.set(jid, newGroupMetaData) //simpen data baru ke store
      }
    }

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

    // // [groupMetadata] [chat]
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

    // pesan
    if (ev["messages.upsert"]) {
      const bem = ev["messages.upsert"];
      //console.log(bem)
      const { messages, type } = bem;

      // NOTIFY
      if (type === "notify") {
        // NOTIFY
        for (let i = 0; i < messages.length; i++) {
          const message = messages[i];
          try {
            // empty message
            if (!message.message) {
              console.log("empty message");
              continue
            }

            // protocol message
            else if (message.message?.protocolMessage) {
              const protocolType = message.message?.protocolMessage?.type

              // protocol delete
              if (protocolType === 0) {
                console.log(`protocol hapus, di hapus oleh ${message.pushName}`)
                continue
              }

              // protocol edit
              else if (protocolType === 14) {
                console.log('protocol edit todo')
                continue
              }

              // fallback for future notifi protocol handling
              console.log("protocol unhandle");
              continue
            }

            // no pushname message
            else if (!message?.pushName) {
              console.log("pesan tanpa pushname");
              continue
            }

            // actual notification message

            // filter jid, blocked
            const v = user.isAuth(message.key)
            if (v.permission === Permission.BLOCKED) {
              console.log(v.message, user.blockedJids.get(v.jid) + ' at ' + (store.groupMetadata.get(message.key?.remoteJid)?.subject || message.key.remoteJid) + '\n')
              continue
            }

            // serialize
            const m = serialize(message)
            const q = m.q
            const mPrint = consoleMessage(m, q)

            if (v.permission === Permission.NOT_ALLOWED) {

              console.log(`[not allowed] [save db]\n` + mPrint)
              continue
            }

            if (!m.text) {

              console.log(`[empty text] [save db]\n` + mPrint)
              continue
            }

            //if (m.key.fromMe) continue

            let handler = null
            let command = null
            try {

              const { valid, prefix } = prefixManager.isMatchPrefix(m.text)
              const textNoPrefix = prefix ? m.text.slice(prefix.length).trim() : m.text.trim()
              command = textNoPrefix.split(/\s+/g)?.[0]

              const handler = pluginManager.plugins.get(command)
              if (handler) {
                if (valid || handler.bypassPrefix) {
                  const jid = m.key.remoteJid
                  const text = textNoPrefix.slice(command.length + 1) // command text => |text|
                  console.log(text)
                  if (text === '-h') {
                    await sendText(m.chatId, pluginHelpSerialize(handler))
                  } else {
                    await handler({ sock, jid, text, m, q, prefix, command });
                  }
                }

              }

            } catch (e) {
              console.error(e.stack)
              const errorLine = getErrorLine(e.stack) || 'gak tauu..'
              const print = `🤯 *plugin fail*\n✏️ used command: ${command}\n📄 dir: ${handler?.dir}\n🐞 line: ${errorLine}\n✉️ error message:\n${e.message}`
              //await react(m, '🥲')
              await sendText(m.chatId, print, m)
              continue
            }


            console.log(`[lookup command] [save db]\n` + mPrint)
            continue


          } catch (e) {
            console.error(e);
            console.log(JSON.stringify(message, null, 2));
          }
        }
      }

      // APPEND
      else {
        for (let i = 0; i < messages.length; i++) {
          const message = messages[i];
          try {
            // empty message
            if (!message.message) {
              console.log("[append] empty message");
              continue
            }

            // protocol message
            else if (message.message?.protocolMessage) {
              const type = message.message?.protocolMessage?.type

              // protocol delete
              if (type === 0) {
                console.log(`[append] protocol hapus, di hapus oleh ${message.pushName}`)
                continue
              }

              // protocol edit
              else if (type === 14) {
                console.log('[append] protocol edit todo')
                continue
              }

              // fallback for future notifi protocol handling
              console.log("[append] protocol unhandle");
              continue
            }

            // no pushname message
            else if (!message?.pushName) {
              console.log("[append] pesan tanpa pushname");
              continue
            }

            // actual notification message

            // filter jid, blocked
            const v = user.isAuth(message.key)
            if (v.permission === Permission.BLOCKED) {
              console.log('[append] ' + v.message, user.blockedJids.get(v.jid) + ' at ' + (store.groupMetadata.get(message.key?.remoteJid)?.subject || message.key.remoteJid) + '\n')
              continue
            }

            // serialize
            const m = serialize(message)
            const q = m.q
            const mPrint = consoleMessage(m, q)

            if (v.permission === Permission.NOT_ALLOWED) {

              console.log(`[append] [not allowed] [save db]\n` + mPrint)
              continue
            }

            if (!m.text) {

              console.log(`[append] [empty text] [save db]\n` + mPrint)
              continue
            }

            //if (m.key.fromMe) continue

            console.log(`[append] [lookup command] [save db]\n` + mPrint)
            continue


          } catch (e) {
            console.error(e);
            console.log(JSON.stringify(message, null, 2));
          }
        }
      }

    }




  });

  if (global.sock) delete global.sock
  global.sock = sock

}

export { pluginManager, bot, store, sock }



const credsPath = path.join(import.meta.dirname, 'auth/creds.json')
const credsExist = await safeRun(fs.promises.access, credsPath)
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
    const question = `enter bot's phone number (6281xxx) or type exit to exit : `
    botPhoneNumber = await ask(question)
    if (botPhoneNumber === 'exit') {
      console.log('bye!')
      process.exit(0)
    }
    startSock({ pn: botPhoneNumber })
  } else if (userLoginMethod === loginMethod[1]) {
    startSock({ qr: true })
  } else if (userLoginMethod === loginMethod[2]) {
    console.log('waduh knp tuh kira kira')
  }

  rl.close()
  console.log('readline closed')

} else {
  console.log('start bot as usual')
  startSock()
}
