teknologi
- baileys https://github.com/WhiskeySockets/Baileys
- sqlite (node js)
- esm
- plugin
- javascript

sabar ya, readme nya masih di bikin

cara jalanin bot
1. install library dulu pakai `npm i`
2. buka file `./src/config.js`
3. isikan nomor bot,
4. isikan nomor owner
5. jalankan file `./src/bot.js`

enjoy

# penjelasan plugin
berikut help untuk plugin core (docs nya masih aku rapikan.. sabar yaa..)

## plugin
main command : plugin

sub command : `install, install-url, uninstall, view`


- cara install plugin

`plugin install`  (reply ke pesan dokumen atau teks yang berisi kode plugin)

`plugin install -r` (sama kaya di atas tapi ini buat replace plugin, biasanya muncul kalau ada plugin yang akan ke replace  akibat plugin install)

*kalian bisa singkat command install menjadi i aja*



- cara kirim plugin ke chat

`plugin get ping` (buat ngirim plugin ping ke chat dalam bentuk dokumen)

`plugin get ping -t` (buat ngirim plugin ping ke chat dalam bentuk teks)



- cara hapus/uninstall plugin

`plugin uninstall ping` (buat hapus plugin ping)

... gitu aja dulu nanti gw lanjutin :V
