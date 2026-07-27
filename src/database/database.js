// node import
import { DatabaseSync } from 'node:sqlite'
import { mkdir } from 'node:fs/promises'
import { dirname } from "node:path"

// my import
import { allPaths } from '../all-paths.js'


await mkdir(dirname(allPaths.database), { recursive: true })
const db = new DatabaseSync(allPaths.database)

db.exec(`
    PRAGMA journal_mode = WAL;
    `)

db.exec(`
CREATE TABLE IF NOT EXISTS contacts (
	id INTEGER PRIMARY KEY,
	primary_id TEXT UNIQUE,
	primary_server TEXT,
	name TEXT,
	secondary_id TEXT UNIQUE,
	username TEXT,
	alias TEXT,
	updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_contacts_primary_server
ON contacts (primary_server);

CREATE INDEX IF NOT EXISTS idx_contacts_secondary_id
ON contacts (secondary_id);
`)

export { db }