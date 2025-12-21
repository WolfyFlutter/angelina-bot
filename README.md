GES SORRY BGT YAK BASE NYA BELUM JADI..
TAPI KALAU MAU COBAIN BOLEH.. CUMA BELUM FINAL HEHE.. SELALU GW UPDATE KOK. DAN GW BIKIN CARA PAKAI NYA DAN FITUR NYA YG AWUWU

TODO : BANYAK
PLIZ GW BELUM UPDATE INI DOC DI BAWAH TAPI UDH KEBURU KOMIT 😭

serialize message object
```javascript
{
  chatId: 'XXXXXXXXXX98950133@g.us',
  senderId: 'XXXXXXXXXX29145@lid',
  pushName: 'wolep',
  type: 'conversation',
  text: '! m',
  messageId: 'XXXXXXXXXX8A6704E1D6A014F2C98142',
  timestamp: 1765707132,
  key: [Getter],
  message: [Getter],
  q: [Getter]
}
```

serialize quoted message object
```javascript
{
  chatId: 'XXXXXXXXXX98950133@g.us',
  senderId: 'XXXXXXXXXX33142@lid',
  pushName: 'ghofar',
  type: 'conversation',
  text: 'ada di video',
  key: [Getter],
  message: [Getter]
}
```

plugin example
```javascript
import { sendText, tag, Category } from '../helper.js'

/**
 * @param {Object} params
 * @param {import("baileys").WASocket} params.sock
 */

async function handler({ sock, jid, text, m, q, prefix, command }) {
    const header =   `hai!\n`
    const pushName = `pushname: ${m.pushName}\n`
    const id =       `lid/pn  : ${m.senderId}\n`
    const tagUser =  `tag     : ${tag(m.senderId)}\n`
    const teksmu =   `text    : ${text}\n`
    const prefixmu = `prefix  : ${prefix}\n`
    const commandmu =`command : ${command}\n`
    const chatId   = `chat id : ${jid}`
    const print = '```' + header + pushName + id + tagUser + teksmu + prefixmu + commandmu + chatId + '```'
    return await sendText(jid, print, m)
}

handler.bypassPrefix = false
handler.pluginName = 'example title'
handler.command = ['example']
handler.alias = ['eg']
handler.category = [Category.DEBUG]
handler.help = 'taruh deskripsi kamu disini'

export default handler
```

another plugin example
```javascript
import { sendText, commandOnly, Category } from './../helper.js'

async function handler({ m, text, jid}) {
   if (commandOnly(m, text)) return await sendText(jid, 'solid', m)
}

handler.pluginName = 'ping'
handler.command = ['ping']
handler.alias = []
handler.category = [Category.BOT]
handler.help = 'buat test apakah bot respond apa kagak.'

export default handler
```

IMPORTANT

tambah nomor bot kamu di ./src/static.js

kemudian add owner di ./data/trusted-jid.json (pakai lid dan pn)
lid biar work di grup, pn buat work di chat pribadi

FITUR BOT : custom store, user manajement, chat manajement, plugin manajement. readme akan saya update lagi kedepannya. untuk command fitur nya kalian liat sendiri dulu ya di kode wkwkw.
