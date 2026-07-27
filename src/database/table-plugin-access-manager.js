import { db } from "./database.js";

db.exec(`
-- TABEL plugin_access
CREATE TABLE IF NOT EXISTS plugin_access_manager (
	chat_id INTEGER NOT NULL,
	contact_id INTEGER NOT NULL,
	file_name TEXT NOT NULL,
	author_id INTEGER NOT NULL,
	timestamp INTEGER DEFAULT (unixepoch()),
	
	-- composite primary key
	PRIMARY KEY (chat_id, contact_id, file_name)
	
	-- FK
	FOREIGN KEY (chat_id)
		REFERENCES contacts (id)
		ON DELETE CASCADE,
		
	FOREIGN KEY (contact_id)
		REFERENCES contacts (id)
		ON DELETE CASCADE
	
	FOREIGN KEY (author_id)
		REFERENCES contacts (id)
		ON DELETE CASCADE
)
`)


const pluginAccessManagerStmt = {}

pluginAccessManagerStmt.grant = db.prepare(`
    INSERT INTO plugin_access_manager
    (chat_id, contact_id, file_name, author_id, timestamp)

    
    VALUES
    (:chatId, :contactId, :fileName, :authorId, :timestamp)
    
    ON CONFLICT DO NOTHING;
`)

pluginAccessManagerStmt.selectAll = db.prepare(`
    SELECT
    chat.primary_id as groupJid,
    contact.primary_id as lid,
    pam.file_name

    FROM plugin_access_manager pam

    LEFT JOIN contacts chat
    ON pam.chat_id = chat.id

    LEFT JOIN contacts contact
    ON pam.contact_id = contact.id
`)

pluginAccessManagerStmt.deleteSinglePlugin = db.prepare(`
    DELETE FROM plugin_access_manager as pam
    WHERE pam.chat_id = :chatId
    AND pam.contact_id = :contactId
    AND pam.file_name = :fileName
    `)

export {pluginAccessManagerStmt}