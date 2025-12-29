import { loadJson, saveJson, allPath, loadJsonFallbackSync } from './helper.js'
import { jidDecode } from "baileys"

// path definition


export default class UserManager {
  blockedJids = new Map()
  trustedJids = new Map()
  groupsWhitelist = new Map()

  groupChatListenMode = GroupListenMode.SELF
  privateChatListenMode = PrivateListenMode.SELF

  constructor() {
    const bjJson = loadJsonFallbackSync(allPath.blockedJids, {})
    this.blockedJids = new Map(Object.entries(bjJson))

    const tjJson = loadJsonFallbackSync(allPath.trustedJids, {});
    this.trustedJids = new Map(Object.entries(tjJson));

    const gwJson = loadJsonFallbackSync(allPath.groupWhitelist, {});
    this.groupsWhitelist = new Map(Object.entries(gwJson));

    const clmDefault = {
      "group": 0,
      "private": 1
    }
    const cmJson = loadJsonFallbackSync(allPath.chatListenMode, clmDefault)
    this.groupChatListenMode = cmJson.group
    this.privateChatListenMode = cmJson.private
  }

  isAuth(key) {
    const qsfs = key?.participant || key?.remoteJid //quick serialize find senderId

    if (this.blockedJids.get(qsfs)) {
      return { permission: Permission.BLOCKED, message: 'blocked', jid: qsfs }
      //return crs(Permission.BLOCKED, 'jid blocked', qsfs)
    }

    const { server } = jidDecode(key?.remoteJid)
    const isPrivateChat = server === "s.whatsapp.net" || server === "lid"
    if (isPrivateChat) {
      if (this.privateChatListenMode === PrivateListenMode.SELF) {
        if (this.trustedJids.has(key.remoteJid)) {
          return { permission: Permission.ALLOWED, message: 'trusted', jid: qsfs }
        } else {
          return { permission: Permission.NOT_ALLOWED, message: 'untrusted jid', jid: qsfs }
        }
        //return this.trustedJids.has(key.remoteJid) ? crs(Permission.ALLOWED, 'trusted jid', qsfs) : crs(Permission.NOT_ALLOWED, 'untrusted jid', qsfs)
      } else {
        return { permission: Permission.ALLOWED, message: 'private chat public', jid: qsfs }
        //return crs(Permission.ALLOWED, 'private chat public', qsfs)
      }
    } else {
      if (this.groupChatListenMode === GroupListenMode.SELF) {
        if (this.trustedJids.has(key?.participant)) {
          return { permission: Permission.ALLOWED, message: 'trusted jid di grup self', jid: qsfs }
        } else {
          return { permission: Permission.NOT_ALLOWED, message: 'untrusted jid DI self group', jid: qsfs }
        }
        //return this.trustedJids.has(key?.participant) ? crs(Permission.ALLOWED, 'trusted jid in group self', qsfs) : crs(Permission.NOT_ALLOWED, 'not trusted jid, self group', qsfs)
      } else if (this.groupChatListenMode === GroupListenMode.DEFAULT) {
        if (this.trustedJids.has(key?.participant)) {
          return { permission: Permission.ALLOWED, message: 'trusted jid di grup default', jid: qsfs }
          //return crs(Permission.ALLOWED, 'trusted jid in group default', qsfs)
        }
        const gwl = this.groupsWhitelist.has(key?.remoteJid)
        if (gwl) {
          return { permission: Permission.ALLOWED, message: 'group in whitelist', jid: qsfs }
        } else {
          return { permission: Permission.NOT_ALLOWED, message: 'grup is not in whitelist', jid: qsfs }
        }
        //return gwl ? crs(Permission.ALLOWED, 'group in whitelist', qsfs) : crs(Permission.NOT_ALLOWED, 'grup is not in whitelist', qsfs)
      } else {
        return { permission: Permission.ALLOWED, message: 'grup publik', jid: qsfs }
        //return crs(Permission.ALLOWED, 'grup public', qsfs)
      }
    }
  }


  getStatus(jid) {
    return {
      groupChatListenMode: this.groupChatListenMode,
      listen: this.groupsWhitelist.get(jid) ? true : false,
      privateChatListenMode: this.privateChatListenMode

    }
  }

  groupChatToggle(chatMode) {
    if (this.groupChatListenMode === chatMode) return false
    this.groupChatListenMode = chatMode
    this.saveChatListenMode()
    return true
  }

  privateChatToggle(chatMode) {
    if (this.privateChatListenMode === chatMode) return false
    this.privateChatListenMode = chatMode
    this.saveChatListenMode()
    return true
  }

  manageTrustedJids(trustOrRemove, lid, note = "(lupa di kasih note)") {
    let result = null
    if (trustOrRemove === "trust") {
      if (!this.trustedJids.has(lid)) {
        this.trustedJids.set(lid, note)
        result = true
      } else {
        result = false
      }
    } else if (trustOrRemove === "untrust") {
      // resolve num
      if (!(isNaN(parseInt(lid)))) {
        lid = Array.from(this.trustedJids)[lid - 1]?.[0]
      }

      if (this.trustedJids.has(lid)) {
        const snapshot = this.trustedJids.get(lid)
        this.trustedJids.delete(lid)
        result = snapshot
      } else {
        result = false
      }
    } else {
      throw Error('param 1 "userOption" is invalid.')
    }
    const json = Object.fromEntries(this.trustedJids.entries())
    saveJson(json, allPath.trustedJids)
    return result
  }
  manageBlockedJids(addOrRemove, lid, note = "(lupa di kasih note)") {
    let result = null
    if (addOrRemove === "add") {
      if (!this.blockedJids.has(lid)) {
        this.blockedJids.set(lid, note)
        result = true
      } else {
        result = false
      }
    } else if (addOrRemove === "remove") {
      // resolve num
      if (!(isNaN(parseInt(lid)))) {
        lid = Array.from(this.blockedJids)[lid - 1]?.[0]
      }

      if (this.blockedJids.has(lid)) {
        const snapshot = this.blockedJids.get(lid)
        this.blockedJids.delete(lid)
        result = snapshot
      } else {
        result = false
      }
    } else {
      throw Error('param 1 "userOption" is invalid.')
    }
    const json = Object.fromEntries(this.blockedJids.entries())
    saveJson(json, allPath.blockedJids)
    return result
  }

  manageGroupsWhitelist(removeOrAdd, groupJid, note = null) {
    if (removeOrAdd === "remove") {
      if (this.groupsWhitelist.has(groupJid)) {
        this.groupsWhitelist.delete(groupJid);
        this.saveGroupWhiteList()
        return true
      } return false
    }

    else if (removeOrAdd === "add") {
      if (this.groupsWhitelist.has(groupJid)) {
        this.groupsWhitelist.set(groupJid, note);
        this.saveGroupWhiteList()
        return false
      }
      this.groupsWhitelist.set(groupJid, note);
      this.saveGroupWhiteList()
      return true
    }

    else {
      throw Error('param 1 "removeOrAdd" is invalid.')
    }
  }

  saveGroupWhiteList() {
    const json = Object.fromEntries(this.groupsWhitelist.entries());
    saveJson(json, allPath.groupWhitelist)
  }

  saveChatListenMode() {
    const json = { group: this.groupChatListenMode, private: this.privateChatListenMode }
    saveJson(json, allPath.chatListenMode)
  }
}



export class GroupListenMode {
  static SELF = 0
  static PUBLIC = 1
  static DEFAULT = 2
}

export class PrivateListenMode {
  static SELF = 0
  static PUBLIC = 1
}

export class Permission {
  static ALLOWED = 'allow_and_serialize'
  static NOT_ALLOWED = 'not_allow_but_serialize'
  static BLOCKED = 'buang'
}

const crs = (permission, message, jid) => ({ permission, message, jid })