// import lib external
import makeWASocket, {
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  Browsers,
  DisconnectReason,
  jidNormalizedUser,
  fetchLatestWaWebVersion,
  delay,
} from "baileys";
import P from 'pino'
import NodeCache from '@cacheable/node-cache';



// import lib node
import fs from 'fs'

// import lib lokal
import Store from "./src/store.js";
import User, { Permission } from "./src/user-manager.js";
import PrefixManager from "./src/prefix-manager.js";

import socketEventLog from "./src/socket-event-log.js";
import patchMessageBeforeSending from "./src/patch-message-before-send.js";
import serialize from './src/serialize.js'

import { loadPlugins, plugins, pluginsNoPrefix, category, pluginsFilaName,  } from './src/plugin-handler.js'
import { pluginHelpSerialize, consoleMessage } from "./src/helper.js";
import { allPath } from "./src/static.js";
import { react, sendText, getErrorLine } from "./src/helper.js";

import * as wa from "./src/helper.js";

if (!allPath.botNumber) {
  console.log('nomor bot belum di isi. edit file ./src/static.js dan edit key botNumber')
  process.exit(0)
}

//Tambahkan ini sekali di awal program
// process.on('uncaughtException', err => {
//   console.error('💥 Uncaught Exception:', err)
// })

// process.on('unhandledRejection', err => {
//   console.error('⚠️ Unhandled Promise Rejection:', err)
// })

// process.on('error', err => {
//   console.error('🚨 Process-level error:', err)
// })


// class define
const msgRetryCounterCache = new NodeCache();
const store = new Store();
const user = new User();
const prefixManager = new PrefixManager(allPath.prefixPath)


let sock //= makeWASocket({})

const bot = {
  pn: null,
  lid: null,
  name: null,
  eventLog: false,
  loadPlugins,
  pluginsFilaName,
  plugins,
  category
};
let gotCode = false;



// #GLOBAL VARIABLE
// global.user = user
// global.bot = bot;
// global.store = store;
// global.wa = wa;
// global.fs = fs
// global.msgRetryCounterCache = msgRetryCounterCache

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


const startSock = async () => {


  console.log("🏃‍♂️ fungsi startSock di panggil");

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
    //enableAutoSessionRecreation: true
  });

  //socketPatch(sock);
  socketEventLog(sock);
  store.bind(sock);

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
        console.log(qr);
        if (!gotCode) {
          //console.log(`please wait, sending login code to ${allPath.botNumber}`);
          const code = await sock.requestPairingCode(allPath.botNumber, 'QQQQQQQQ');
          console.log(`code ${code.match(/.{4}/g).join("-")}`);
          gotCode = true;
        }
      }
    }

    // handle kredensial
    if (ev["creds.update"]) {
      const bem = ev["creds.update"];

      // pairing gagal


      if (bem.me?.id && bem.me?.lid) {
        bot.name = bem.me?.name || 'sexy bot';
        bot.pn = jidNormalizedUser(bem.me.id);
        bot.lid = jidNormalizedUser(bem.me.lid);

        const obj = {
          notify: bot.name,
          verifiedName: undefined,
        };

        store.contacts.set(bot.pn, obj)
        store.contacts.set(bot.lid, obj)

      }
      await saveCreds();
    }

    // pesan
    if (ev["messages.upsert"]) {
      const bem = ev["messages.upsert"];
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
              const type = message.message?.protocolMessage?.type

              // protocol delete
              if (type === 0) {
                console.log(`protocol hapus, di hapus oleh ${message.pushName}`)
                continue
              }

              // protocol edit
              else if (type === 14) {
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

              // no prefix plugin
              command = m.text.trim().split(/\s+/g)?.[0]
              handler = pluginsNoPrefix.get(command);
              if (handler) {
                const jid = m.key.remoteJid
                const prefix = null
                const text = m.text.slice(command.length).trim() || null;
                if (text === '-h') {
                  await wa.sendText(m.chatId, pluginHelpSerialize(handler))
                } else {
                  await handler({ sock, jid, text, m, q, prefix, command });
                }
              }

              // prefix plugin
              else {
                const { valid, prefix } = prefixManager.isMatchPrefix(m.text)
                if (!valid) continue
                const textNoPrefix = prefix ? m.text.slice(prefix.length).trim() : m.text
                command = textNoPrefix.trim().split(/\s+/g)?.[0]
                handler = plugins.get(command);
                if (handler) {
                  const jid = m.key.remoteJid
                  const text = textNoPrefix.slice(command.length).trim() || null;
                  if (text === '-h') {
                    await wa.sendText(m.chatId, pluginHelpSerialize(handler))
                  } else {
                    await handler({ sock, jid, text, m, q, prefix, command });
                  }
                }
              }
            } catch (e) {
              console.error(e.stack)
              const errorLine = getErrorLine(e.stack) || 'gak tauu..'
              const print = `🤯 *plugin fail*\n✏️ used command: ${command}\n📄 dir: ${handler.dir}\n🐞 line: ${errorLine}\n✉️ error message:\n${e.message}`
              await react(m, '🥲')
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

  //if (global.sock) delete global.sock
  //global.sock = sock
}

startSock()

export { sock, store, bot, prefixManager, user, plugins, pluginsNoPrefix };
