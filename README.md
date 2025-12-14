sc not finished yet. tapi kalau mau coba boleh aja.

```javascript
console.log('wolep')
```
ges sorry kalau kode nya jelek :v
maaf kalau repo nya berantakan wkwk
masih belajar

maaf banget kalau gak sesuai sama ekspektasi, gw baru peretama kali bikin repo T^T
silakan cacimaki di issue
ini bukan buat bot ready, jadi kode nya bakalan berantakan banget, banyak error, unfinish code, banyak console.log dan sejenisnya karena emang buat belajar :v

tambah nomor bot kamu di ./src/static.js
kemudian add owner di ./data/trusted-jid.json (pakai lid dan pn)
lid biar work di grup, pn buat work di chat pribadi

rencana fitur

[custom store]
cacheGroupMetadata : ✅
di pakai buat save metadata group, tujuannya biar nanti kalian bisa bikin fitur kaya tag all, bikin fitur random selected member siapa tau bikin fitur simple kaya "siapa yang paling furry". jadi gak ngefetch ke server wa terus. dan cacheGroupMetadata juga bisa bikin sendMessage kalian lebih kenceng.

pushName : ✅
aku juga bikin store yang simpen pushname, jadi kalian bisa pakai buat kebutuhan fitur kalian kaya misal mau bikin fitur iqc yang perlu username dari no wacap yang kalian quotedkan. atau bikin fitur lainnya yang perlu pushname.

[bot fitur]
user manager : ✅
buat manage user, block user, add owner/trusted user, kalian bisa menambah lebih dari satu owner, block nomor yang bot biar tidak mengganggu

chat manager : ✅
kalian bisa atur bot kalian mau respond nya bagaimana. maksud nya bisa on di satu grup, bisa on di grup tertentu, dan off. bisa overide semua ke mode self. di private chat juga bisa di atur. sangat fleksibel dan easy to use. sorry yak nanti gw update lagi fitur nya biar jelas hehe. gw jelasin abstrak aja dulu

plugin manager : *PENDING*
biasalah crud plugin. masih gw kerjain. hehe
