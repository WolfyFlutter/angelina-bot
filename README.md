
![Screenshot_2025-12-29-22-19-02-787-edit_com whatsapp](https://github.com/user-attachments/assets/97b8a530-3853-4024-b4d4-ebc1109eae4b)

fitur
- bisa run di termux, panel, vps, rdp, laptop
- store groupMetadata, pushname
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

![Screenshot_2025-12-29-22-24-44-775_com whatsapp](https://github.com/user-attachments/assets/bdf882fa-7695-4d07-8f14-6e1959c3e01b)

small ram usage

![IMG_20251229_221808](https://github.com/user-attachments/assets/a184f4de-1b85-4dae-89b9-64fcb0aacaf6)




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


join grup wacap ku buat share plugin, saran, dll

https://chat.whatsapp.com/HjDJzwSBZQW0cLYbJorXP2
