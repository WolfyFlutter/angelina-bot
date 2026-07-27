import { db } from "./database.js";

db.exec(`
CREATE TABLE IF NOT EXISTS group_participants (
    chat_id INTEGER NOT NULL REFERENCES contacts(id),
    contact_id INTEGER NOT NULL REFERENCES contacts(id),
    invited_by INTEGER REFERENCES contacts(id),
    invited_at INTEGER,
    kicked_by INTEGER REFERENCES contacts(id),
    kicked_at INTEGER,
    admin TEXT,
    admin_updated_by INTEGER REFERENCES contacts(id),
    admin_updated_at INTEGER,
    label TEXT,
    label_updated_at INTEGER,	

    PRIMARY KEY (chat_id, contact_id)
) WITHOUT ROWID;
`)

const groupParticipantsStmt = {}

groupParticipantsStmt.upsertParticipant = db.prepare(`
-- query ini hanya boleh di execute kalau participan gak ada di group yang bersangkutan
INSERT INTO group_participants (
	chat_id,
	contact_id,
	invited_by,
	invited_at,
	admin,
	admin_updated_at,
	admin_updated_by,
	kicked_by,
	kicked_at
)
VALUES (
	:chatId, --chat_id [chat.id]
	:contactId, --contact_id [contact.id]
	
	-- ASSIST STUFF
	:invitedBy, --invited_by [chat.id / null]
	:invitedAt ,  --invited_at [second timestamp]
	
	-- ADMIN STUFF
	:admin, --admin [admin / null]
	:adminUpdatedAt, --admin_updated_at [second timestamp]
	:adminUpdatedBy, --admin_updated_by [chat.id / null ]
	
	-- KICKED STUFF 
	NULL, --kicked_by [DONT MODIFY]
	NULL --kicked_at [DONT MODIFY]
) 

ON CONFLICT DO UPDATE
	SET
	
	kicked_at = CASE
		WHEN kicked_at IS NOT NULL
		THEN NULL
	END,
	
	kicked_by = CASE
		WHEN kicked_at IS NOT NULL
		THEN NULL
	END,
	
	invited_by = CASE
		WHEN kicked_at IS NOT NULL
		THEN excluded.invited_by
		ELSE invited_by
	END,
	
	invited_at = CASE
		WHEN kicked_at IS NOT NULL
		THEN excluded.invited_at
		ELSE invited_at
	END,
	
	admin = excluded.admin,
	
--	admin_updated_by = CASE
--		WHEN admin = excluded.admin
--		THEN admin_updated_by
--		ELSE excluded.admin_updated_by
--	END,
		
	admin_updated_at = CASE
		WHEN admin IS excluded.admin AND admin_updated_at IS NOT NULL
		THEN admin_updated_at
		ELSE excluded.admin_updated_at
	END;
`)

groupParticipantsStmt.leaveParticipant = db.prepare(`
	INSERT INTO group_participants (
		chat_id,
		contact_id,
		invited_at,
		kicked_by,
		kicked_at
	)

	VALUES(
		:chatId, --chat_id,
		:contactId, --contact_id,
		:invitedAt, --invited_at,
		:kickedBy, --kicked_by,
		:kickedAt --kicked_at
	)

	ON CONFLICT DO UPDATE
	SET
		-- require value
		kicked_by = :kickedBy,
		kicked_at = :kickedAt,

		-- DONT MODIFY
		admin = NULL,
		admin_updated_at = NULL,
		admin_updated_by = NULL,

		-- DONT MODIFY
		label = NULL,
		label_updated_at = NULL;	
`)

groupParticipantsStmt.updateAdmin = db.prepare(`
INSERT INTO group_participants (
	chat_id,
	contact_id,
	admin,
	admin_updated_by,
	admin_updated_at,
	invited_at
)

VALUES (
	:chatId, -- chat.id <chat.id>
	:contactId, -- contact_id <contacts.id>
	:admin, -- admin <biasanya admin / null>
	:adminUpdatedBy, -- admin_updated_by <contacts.id>
	:adminUpdatedAt, -- admin_updated_at <second timestamp>
	:invitedAt --invited_at <second timestamp>
)

ON CONFLICT DO UPDATE
SET
	
	admin = excluded.admin,
	admin_updated_at = excluded.admin_updated_at,
	admin_updated_by = excluded.admin_updated_by,
	
	invited_by = CASE
	WHEN kicked_at IS NOT NULL
		THEN NULL
		ELSE invited_by
	END,
	
	invited_at = CASE
	WHEN kicked_at IS NOT NULL
		THEN excluded.invited_at
		ELSE invited_at
	END,
	
	kicked_by = NULL,
	kicked_at = NULL;

`)

groupParticipantsStmt.updateMemberLabel = db.prepare(`
	INSERT INTO group_participants
	(chat_id, contact_id, label, label_updated_at, invited_at)
	VALUES (
		:chatId, -- chats.id
		:contactId, -- contacts.id
		:label, -- label <text/null>
		:labelUpdatedAt,  -- label_updated_at <timestamp second>
		:invitedAt  -- invited_at <timestamp second>
	) ON CONFLICT
	DO UPDATE 
	SET
		label = excluded.label,
		label_updated_at= excluded.label_updated_at
`)



// buat update outdated lid di db
groupParticipantsStmt.getAllLid = db.prepare(`
	SELECT primary_id as lid
	FROM group_participants gp
	LEFT JOIN contacts con
	ON gp.contact_id = con.id

	WHERE 
	gp.kicked_at IS NULL AND
	gp.chat_id = ?
`)

// buat load admin ke cache
groupParticipantsStmt.getAllAdmin = db.prepare(`
SELECT 
	chat.primary_id as jid,
	contact.primary_id as lid, 
	gp.admin
FROM group_participants gp
	LEFT JOIN contacts chat
	ON gp.chat_id = chat.id
	
	LEFT JOIN contacts contact
	ON gp.contact_id = contact.id

WHERE gp.chat_id IN (
	SELECT gp.chat_id
	FROM group_participants gp
	WHERE gp.contact_id IN (
		SELECT id
		FROM contacts
		WHERE secondary_id = :botPn
	)
	AND gp.kicked_at IS NULL
)
AND admin IS NOT NULL
`)

groupParticipantsStmt.getAllMemberLabel = db.prepare(`
    SELECT
	chat.primary_id as jid,
	contact.primary_id as lid, 
	gp.label
	
	FROM group_participants gp
	
	LEFT JOIN contacts chat
	ON gp.chat_id = chat.id
	
	LEFT JOIN contacts contact
	ON gp.contact_id = contact.id
	
	WHERE label IS NOT NULL
`)

groupParticipantsStmt.deleteGroupChat = db.prepare(`
	DELETE FROM group_participants
	WHERE chat_id = :chatId
`)





export { groupParticipantsStmt }




