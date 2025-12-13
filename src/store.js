import {
    isJidGroup,
    areJidsSameUser
} from 'baileys'
import { bot } from '../index.js'
import { loadJson, saveJson, log } from './helper.js'
import { allPath } from './static.js'
import { KeyedMutex } from './keyed-mutex.js'
import fs from 'node:fs'

class Store {
    //sock = null
    groupMetadata = new Map()
    //chats = new Map()
    contacts = new Map()

    antri = new KeyedMutex()

    constructor() {
        // load all chats file
        // const listFile = fs.readdirSync(allPath.storeChatsPath)
        // listFile.forEach(fileName => {
        //     const key = fileName.replace(/\.json$/, '')
        //     const json = loadJson(allPath.storeChatsPath + '/' + fileName)
        //     this.chats.set(key, json)
        // })
    }

    getGroupMetadata = async (jid) => {

        let data = this.groupMetadata.get(jid)
            if (!data) {
                try {
                    const fresh = await this.sock.groupMetadata(jid)
                    console.log(`↗️ fetch group metadata: ${fresh.subject}`, fresh)
                    this.groupMetadata.set(jid, fresh)
                    return fresh
                } catch (error) {
                    console.error(`gagal fetch group metadata: ${jid}`, error)
                    return undefined
                }
            } else {
                log(`♻️ cache: ${data.subject}`)
                return data
            }

        // return this.antri.run(jid, async () => {
            
        // })
    }

    bind = (sock) => {
        //this.sock = sock
        Object.defineProperty(this, 'sock', {
            value: sock,
            enumerable: false,
            writable: true,
            configurable: true
        })

        sock.ev.process(async (ev) => {
            // [contacts]
            if (ev['contacts.update']) {
                const bem = ev['contacts.update']
                for (let i = 0; i < bem.length; i++) {
                    const partialUpdate = bem[i]
                    const { id, ...rest } = partialUpdate
                    this.contacts.set(id, rest)
                }
            }

            // [groupMetadata] 
            if (ev['groups.update']) {
                const bem = ev['groups.update']
                for (let i = 0; i < bem.length; i++) {
                    const partialUpdate = bem[i] //bem (baileys event map), karena bentukan array jadi musti di ambil 1 1
                    const jid = partialUpdate.id // simpen dulu current jid nyah
                    const current = await this.getGroupMetadata(jid) //ambil dulu grup matadata current jid
                    if (!current) return
                    Object.assign(current, partialUpdate)
                }
            }

            // [groupMetadata] [chats]
            if (ev['groups.upsert']) {
                const bem = ev['groups.upsert']
                for (let i = 0; i < bem.length; i++) {
                    const newGroupMetaData = bem[i] //bem (baileys event map), karena bentukan array jadi musti di ambil 1 1
                    const jid = newGroupMetaData.id // simpen dulu current jid nyah
                    this.groupMetadata.set(jid, newGroupMetaData) //simpen data baru ke store
                }
            }

            if (ev['group-participants.update']) {
                const bem = ev['group-participants.update']
                const action = bem.action
                const jid = bem.id
                const selectedParticipants = bem.participants

                const promoteDemote = async (participantsArray, nullOrAdmin) => {
                    const current = await this.getGroupMetadata(jid)
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
                        const current = await this.getGroupMetadata(gMetadataJid)
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
                    const current = await this.getGroupMetadata(jid)
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
                        await remove(selectedParticipants, this.groupMetadata, jid)
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
                        if (!partialUpdate.hasOwnProperty('ephemeralExpiration')) return
                        const value = partialUpdate.ephemeralExpiration || undefined
                        const ephemUpdate = { ephemeralDuration: value }
                        const current = await this.getGroupMetadata(jid) //ambil dulu grup matadata current jid

                        Object.assign(current, ephemUpdate)
                        console.log('group ephemeral update', ephemUpdate)
                    }
                }
            }
        })
    }

    updateChats = (jid, partialUpdate) => {
        log('chat update', partialUpdate)

        // checking file exist or no
        const filePath = allPath.storeChatsPath + '/' + jid + '.json'
        const exist = fs.existsSync(filePath)

        if (!exist) { // if file is not exist. create new one save to ram and file
            saveJson(partialUpdate, filePath)
            this.chats.set(jid, partialUpdate)
        } else { // if file exist, just update data in memory and save to file
            const currentData = this.chats.get(jid)
            const updatedJson = Object.assign(currentData, partialUpdate)
            this.chats.set(jid, updatedJson)
            saveJson(updatedJson, filePath)
        }
    }
}

export default Store