import { db } from "./database.js";

db.exec(`
-- TABLE CREATE
CREATE TABLE IF NOT EXISTS messages (
	id INTEGER PRIMARY KEY,
	message_id TEXT,
	chat_id INTEGER REFERENCES contacts (id),
	contact_id INTEGER REFERENCES contacts (id),
	content_id INTEGER REFERENCES message_contents (id),
	text TEXT,
	timestamp INTEGER,
	buffer BLOB,
	node BLOB
);

-- INDEX
CREATE INDEX IF NOT EXISTS idx_msg_msg_id
ON messages (message_id);

CREATE INDEX IF NOT EXISTS idx_msg_chat
ON messages (chat_id);

`)

const messagesStmt = {}

messagesStmt.deleteAllMessages = db.prepare(`
	DELETE FROM messages;
	vacuum
	`)

messagesStmt.insert = db.prepare(`

INSERT INTO messages (
	message_id,
	chat_id,
	contact_id,
	content_id,
	text,
	timestamp,
	buffer,
	node
)

VALUES (
	:message_id,
	:chat_id,
	:contact_id,
	:content_id,
	:text,
	:timestamp,
	:buffer,
	:node
)
    `)

messagesStmt.getRow = db.prepare(`
	select * from messages
	WHERE message_id = :messageId
	ORDER BY id DESC
	LIMIT 1
`)

messagesStmt.getChatStats = db.prepare(`
SELECT 
	count (*) as total,
	mc.content,
	sum(length(buffer)) as totalBytes

FROM messages m

LEFT JOIN message_contents mc
ON m.content_id = mc.id 

WHERE m.chat_id = :chatId
	GROUP BY m.content_id
	ORDER BY total DESC
`)

messagesStmt.globalStat = db.prepare(`
SELECT
	chat_id as contactId,
	chat.name as name,
	chat.primary_id as primaryId,
	chat.primary_server as primaryServer,
	count (*) as totalMessages,
	SUM(length(buffer)) AS totalBytes

FROM messages

LEFT JOIN contacts chat
ON messages.chat_id = chat.id

GROUP BY
	chat_id
	
ORDER BY
	lower (chat.primary_server),
	totalMessages DESC
`)

export { messagesStmt }