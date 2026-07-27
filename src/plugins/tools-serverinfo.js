/**
 * @import { PluginCtx, Plugin } from "../types/types.js"
 */

import os from "node:os"
import process from "node:process"
import v8 from "node:v8"

/**
 * format bytes menjadi GB
 * @param {number} bytes
 */
function toGB(bytes) {
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

/**
 * format bytes menjadi MB
 * @param {number} bytes
 */
function toMB(bytes) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

/**
 * format detik menjadi human readable
 * @param {number} seconds
 */
function formatDuration(seconds) {
    seconds = Math.floor(seconds)

    const d = Math.floor(seconds / 86400)
    seconds %= 86400

    const h = Math.floor(seconds / 3600)
    seconds %= 3600

    const m = Math.floor(seconds / 60)
    const s = seconds % 60

    /** @type {string[]} */
    const out = []

    if (d) out.push(`${d}d`)
    if (h) out.push(`${h}h`)
    if (m) out.push(`${m}m`)
    out.push(`${s}s`)

    return out.join(" ")
}

/**
 * main plugin function
 * @param {PluginCtx} ctx
 */
async function run(ctx) {
    const { m } = ctx

    const cpus = os.cpus()
    const cpu = cpus[0]

    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem

    const msg = [
        "🖥️ *SERVER INFORMATION*",
        "",
        "*Hardware*",
        `• CPU : ${cpu?.model ?? "Unknown"}`,
        `• Core : ${cpus.length || "Unknown"}`,
        `• Clock : ${cpu?.speed ? cpu.speed + " MHz" : "Unknown"}`,
        `• Architecture : ${os.arch()}`,
        `• Endianness : ${os.endianness()}`,
        "",
        "*Memory*",
        `• Total : ${toGB(totalMem)}`,
        `• Used : ${toGB(usedMem)}`,
        `• Free : ${toGB(freeMem)}`,
        "",
        "*Operating System*",
        `• Platform : ${os.platform()}`,
        `• Type : ${os.type()}`,
        `• Release : ${os.release()}`,
        `• Hostname : ${os.hostname()}`,
        `• Uptime : ${formatDuration(os.uptime())}`,
        "",
        "*Runtime*",
        `• Node.js : ${process.version}`,
        `• V8 : ${process.versions.v8}`,
        `• PID : ${process.pid}`,
        `• Architecture : ${process.arch}`,
        `• Heap Limit : ${toGB(v8.getHeapStatistics().heap_size_limit)}`,
        "",
        "*Process Memory*",
        `• RSS : ${toMB(process.memoryUsage().rss)}`,
        `• Heap Used : ${toMB(process.memoryUsage().heapUsed)}`,
        `• Heap Total : ${toMB(process.memoryUsage().heapTotal)}`,
        `• External : ${toMB(process.memoryUsage().external)}`
    ].join("\n")

    return await m.reply(msg)
}

/** @type {Plugin} */
const plugin = {
    run,
    id: "server-info",
    name: "serverinfo",
    commands: ["sysinfo"],
    categories: ["other"],
    description: "menampilkan informasi hardware dan software server"
}

plugin.meta = {
    fileName: "tools-serverinfo.js",
    version: "1",
    author: "wolep",
    note: "monitor your server"
}

export default plugin