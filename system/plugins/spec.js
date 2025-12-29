import { sendText, botInfo, userManager, textOnlyMessage, msToReadableTime } from '../helper.js'
import os from 'node:os'

/**
 * @param {import('../types/plugin.js').HandlerParams} params
 */

async function handler({ sock, m, q, text, jid, command, prefix }) {

    // return return
    if (!userManager.trustedJids.has(m.senderId)) return
    if (!textOnlyMessage(m)) return
    if (q) return
    if (text) return

    process.send({ type: 'get-parrent-uptime' })


    const bullet = '- '
    const cpus = os.cpus()
    const arch = bullet + 'arch ' + os.arch()
    const cpu_cores = bullet + 'core ' + cpus.length + ''
    const cpu_name = bullet + 'cpu ' + cpus[0].model
    const os_version = bullet + 'os ' + os.version()

    const toGB = (byte) => (byte / 1073741824).toFixed(2) + ' GB'
    const ramTotal = os.totalmem()
    const ramFree = os.freemem()
    const ramUsage = ramTotal - ramFree

    const ram = `${bullet}RAM ${toGB(ramTotal)}`
    const node_version = bullet + 'node ' + process.version

    const ram_usage = `${bullet}ram usage ${(ramUsage / ramTotal * 100).toFixed(0)}% used. ${toGB(ramFree)} free.`
    const nodeRuntime = bullet + 'bot runtime ' + msToReadableTime(parseInt(process.uptime()) * 1000)
    const hostRuntime = bullet + 'host runtime ' + msToReadableTime(parseInt(os.uptime()) * 1000)

    const hardware = cpu_name + '\n' + cpu_cores + '\n' + ram
    const software = os_version + '\n' + arch + '\n' + node_version
    const system = hostRuntime + '\n' + ram_usage + '\n' + nodeRuntime

    const print = '*hardware*\n' + hardware + '\n\n*software*\n' + software + '\n\n*system*\n' + system
    return await sendText(sock, jid, print)
}

handler.pluginName = 'spec'
handler.description = 'buat liat spec hardware'
handler.command = ['spec']
handler.category = ['built-in']

handler.config = {
    systemPlugin: true,
}

handler.meta = {
    fileName: 'spec.js',
    version: '1',
    author: botInfo.an,
    note: 'idk',
}

export default handler