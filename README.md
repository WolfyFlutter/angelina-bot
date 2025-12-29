fitur
- bisa run di termux, panel, vps, rdp, laptop
- chat manager (self / public / individual group / override setting)
- user manager (bisa block user / tambah trusted user (owner)
- prefix manager (hidupkan / matikan prefix / tambah prefix baru)
- plugin manager (pasang plugin, hapus plugin)
- isolated hot process (bisa restart bot kapanpun... cocok kalau konsumsi ram udh tinggi)
- easy customize (ada banyak pilihan edit tampilan menu.. cek aja sendiri wkwk)
- eval (buat yg suka main kode)
- eval async (eval juga tapi di bungkus async function)
- shell access

- small ram usage
- fast and light weight
- use node js terbaru ya!



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
import { textOnlyMessage, sendText } from '../../system/helper.js'

/**
 * @param {import('../../system/types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {
    if (!textOnlyMessage(m)) return
    if (q) return
    if (text) return
    await sendText(sock, jid, `halo juga`, m)
    return
}

handler.pluginName = 'halo'
handler.description = 'deskripsi kamu'
handler.command = ['halo']
handler.category = ['test']

handler.meta = {
    fileName: 'halo.js',
    version: '1',
    author: 'ambatukam',
    note: 'ambasing',
}
export default handler
```


cara pakai


```
git clone
npm i
npm start
pilih qr apa pairing code
lalu cepet" kirim pesan ke bot dengan command request_owner (buat jadi owner pertama) via private chat, bisa juga di pakai self bot (diri sendiri jadi bot, kirim nya ke diri sendiri juga)
enjoy
```
