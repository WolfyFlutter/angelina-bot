GES SORRY BGT YAK BASE NYA BELUM JADI..
TAPI KALAU MAU COBAIN BOLEH.. CUMA BELUM FINAL HEHE.. SELALU GW UPDATE KOK. DAN GW BIKIN CARA PAKAI NYA DAN FITUR NYA YG AWUWU

TODO : 
- BIKIN PLUGIN MANAGER / PLUGIN STORE

- BIKIN MEKANISME INIT OWNER PERTAMA KALI SELAIN CARA EDIT LID MANUAL

- BIKIN STORE LABEL

- BIKIN VIDEO / CARA INSTALL / PAKA FITUR BOT

- BIKIN PLUGIN EXAMPLE

- BIKIN ISOLATED PROCESS (LAUNCHER DAN MAIN PROCESS)




TODO OPSIONAL


- BIKIN THEME MANAGER / THEME STORE


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


IMPORTANT

dah support terminal, kalau mau coba langsung aja npm start, tapi sebelum itu edit dulu file user/data/trusted-jids.json tambahin lid mu disana biar jadi owner
