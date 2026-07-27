class AsyncKeyedLock {
    queue = new Map()

    async withLock(key, fn) {
        const prev = this.queue.get(key) || Promise.resolve()
        let release
        const curr = new Promise(r => (release = r))
        this.queue.set(key, prev.then(() => curr))

        await prev

        try {
            return await fn()
        } finally {
            release()
            if (this.queue.get(key) === curr) {
                this.queue.delete(key)
            }
        }
    }
}

const tempFileLock = new AsyncKeyedLock()
const pluginManagerLock = new AsyncKeyedLock()
const defaultLock = new AsyncKeyedLock()
export { tempFileLock, pluginManagerLock, defaultLock }