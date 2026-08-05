# Welcome!
selamat datang di repo saya... jangan lupa tinggalkan bintang kalau belum -w-

## 🤖 about
angelina bot adalah bot whatsapp yang di bangun menggunakan bahasa javascript, bot ini menggunakan library dari [WhiskeySockets/Baileys](https://github.com/WhiskeySockets/Baileys). struktur plugin, ESM, menggunakan node sql untuk menyimpan data messages, contacts, participants, member label, dan lain lain.

fitur sc :
- WITH JSDOC, jadi kalian gak perlu skill dukun (nebak nerawang param / return type haha)
- bisa jalan di termux, panel, rdp, vps, apapun yang ada node js nya :v
- sudah include custom store menggunakan node:sql
- custom plugin access per group per user
- custom prefix
- custom menu thumbnail
- core plugin
- plugin crud
- dan lain lain... (gw bingung apa lagi fiturnya.. nanti gw edit lagi)

## 🚀 cara menjalankan bot
cara menjalankan bot mudah, lakukan langkah langkah berikut
1. install library dulu pakai `npm i`
2. buka file `./src/config.js`
3. isikan nomor bot,
4. isikan nomor owner
5. jalankan file `./src/bot.j

## 🧩 penjelasan plugin core

<details>
  <summary>### Click to expand</summary>

  ### Hidden Heading
  This content is hidden by default. You can include:
  * Bullet points
  * Images
  * Links
  
</details>

### ping
<details>
  <summary>tampilkan ping help</summary>
  
command `ping`\
fungsi : buat cek bot respond apa engga\
cara pakai : cukup ketik ping, maka bot akan pemberikan respond
</details>

### plugin manager
<details>
  <summary>tampilkan plugin manager help</summary>
  
command : `plugin`
```
plugin install [-r]
plugin install-url <url> [-r]
plugin uninstall <cmd>
plugin view <protected|bypass>
```

usage:

install [-r] (wajib reply pesan)
- digunakan untuk install plugin
- wajib reply ke pesan dokumen file js, atau pesan teks yang berisi kode plugin lalu cukup ketik `plugin install`
- bisa di singkat jadi i, command nya jadi `plugin i`
- jika ingin replace plugin maka wajib sertakan param `-r` maka jadi `plugin install -r` atau `plugin i -r`

install-url <url> [-r]
- digunakan untuk install plugin menggunakan url
- command langsung ketik `plugin install-url https://link-plugin.js` tanpa reply
- dengan reply ketik command `plugin install-url` maka otomatis akan pick url pertama sebagai param
- plugin bisa di singkat jadi `plugin iu`
- jika ingin replace plugin maka wajib sertakan param `-r` maka jadi `plugin install-url -r` atau `plugin iu -r`

uninstall \<cmd\>
- digunakan untuk menghapus / uninstall plugin
- contoh penggunaan `plugin uninstall xx` dimana xx = nama command plugin
- bisa di singkat jadi `plugin u`

view \<protected|bypass\>
- protected digunakan untuk melihat command plugin yang dilindungi
- bypass digunakan untuk melihat command yang bypass prefix
</details>

## ✉️ Struktur Message Serialize
### m
objek mya punya beberapa fungsi kaya
```javascript
m.download() -> output stream
m.download("buffer") -> output buffer
m.delete() -> buat hapus pesan
m.react("⭐") -> buat react
m.reply("solid solid solid") -> buat quick reply text
```
untuk struktur nya kaya gini 
```json
{
  "key": "KEY_OBJECT_BAILEYS",
  "messageTimestamp": 1785830611,
  "pushName": "nama apa aja",
  "broadcast": false,
  "message": "OBJEK_MESSAGE_BAILEYS",
  "chat": {
    "id": 61,
    "primaryId": "xx@g.us",
    "primaryServer": "g.us",
    "name": "AngelinaEmpire || Furry Indonesia solid solid solid 😎",
    "secondaryId": null
  },
  "contact": {
    "id": 77,
    "primaryId": "xx@lid",
    "primaryServer": "lid",
    "name": "wolep",
    "secondaryId": "xx@s.whatsapp.net"
  },
  "contentType": {
    "id": 1,
    "content": "extendedTextMessage"
  },
  "isPrivate": false,
  "isGroup": true,
  "group": {},
  "q": "QUOTED_OBJECT",
  "content": "extendedTextMessage",
  "text": "iya",
  "sender": "xx@lid",
  "node": {
    "tag": "message",
    "attrs": {
      "from": "xx@g.us",
      "type": "text",
      "id": "xx",
      "participant": "xx@lid",
      "sts": "1785830611359619",
      "verified_level": "unknown",
      "notify": "bilsanz",
      "addressing_mode": "lid",
      "verified_name": "xx",
      "participant_pn": "xx@s.whatsapp.net",
      "t": "1785830611"
    },
    "content": "NODE_CONTENT_TAPI_ENC_NYA_DI_BUANG"
  }
}
```
### q
sama kaya m, objek mya punya beberapa fungsi kaya
```javascript
q.download() -> output stream
q.download("buffer") -> output buffer
q.delete() -> buat hapus pesan
q.react("⭐") -> buat react
q.reply("solid solid solid") -> buat quick reply text
```
untuk struktur nya kaya gini 
```json
{
  "isPrivate": false,
  "isGroup": true,
  "group": {
    "admin": "superadmin",
    "label": "wolep.dev"
  },
  "chat": {
    "id": 61,
    "primaryId": "xx@g.us",
    "primaryServer": "g.us",
    "name": "AngelinaEmpire || Furry Indonesia solid solid solid 😎",
    "secondaryId": null
  },
  "contact": {
    "id": 5,
    "primaryId": "xx@lid",
    "primaryServer": "lid",
    "name": "wolep",
    "secondaryId": "xx@s.whatsapp.net"
  },
  "contentType": {
    "id": 2,
    "content": "conversation"
  },
  "key": {
    "id": "xx",
    "participant": "xx@lid",
    "remoteJid": "xx@g.us",
    "fromMe": false
  },
  "message": "OBJEK_MESSAGE_BAILEYS",
  "sender": "xx@lid",
  "pushName": "wolep",
  "text": "sebaiknya segera biar gak kabur jauh di bawa motornya",
  "content": "conversation"
}
```

## 🧑‍💻 struktur plugin
sementara ini dulu :v 
```javascript
/**
 * @import {PluginCtx, Plugin} from "../types/types.js"
 */

/**
 * main plugin function
 * @param {PluginCtx} ctx 
 * @returns {Promise <any>}
 */
async function run(ctx) {
    const { m } = ctx
    const name = m.contact.name || 'kamu'
    return await m.reply('wuff! hai ' + name)
}

/** @type {Plugin} */
const plugin = {
    run,
    name: "ping",
    commands: ["ping"],
    categories: ["core"],
    description: "cek bot apakah ok atau gak ok"
}

plugin.meta = {
    fileName: "core-ping.js",
    version: "1",
    author: "wolep",
    note: "idk"
}

plugin.config = {
    protected: true,
    bypassPrefix: true
}

export default plugin
```
