import { db } from "./database.js"

const contactsStmt = {}

contactsStmt.upsertContactFromHistorySync = db.prepare(`
    INSERT INTO contacts (
        primary_id,
        primary_server,
        name,
        secondary_id,
        updated_at
    )

    VALUES (
        :primaryId,
        :primaryServer,
        :name,
        :secondaryId,
        :updatedAt
    )

    ON CONFLICT DO UPDATE SET
    primary_id     = coalesce (excluded.primary_id, primary_id),
    primary_server = coalesce (excluded.primary_server, primary_server),
    secondary_id   = coalesce (excluded.secondary_id, secondary_id),
    name           = coalesce (excluded.name, name),
    updated_at     = coalesce (updated_at, excluded.updated_at);
`)


contactsStmt.contactUpsert = db.prepare(`
    INSERT INTO contacts (
        primary_id,
        primary_server,
        name,
        secondary_id,
        updated_at
    )

    VALUES (
        :primaryId,
        :primaryServer,
        :name,
        :secondaryId,
        :updatedAt
    )

    ON CONFLICT DO UPDATE SET
    primary_id     = coalesce (excluded.primary_id, primary_id),
    primary_server = coalesce (excluded.primary_server, primary_server),
    secondary_id   = coalesce (excluded.secondary_id, secondary_id),
    name           = coalesce (excluded.name, name),
    updated_at     = coalesce (updated_at, excluded.updated_at)

    RETURNING
    id,
    primary_id as primaryId,
    primary_server as primaryServer,
    name,
    secondary_id as secondaryId
`)

contactsStmt.updateContactNameAndSecondaryId = db.prepare(`
    UPDATE contacts
    SET
        name 		 = coalesce (:name, name),
        secondary_id = coalesce (:secondaryId, secondary_id),
        updated_at   = coalesce (:updatedAt, unixepoch())

    WHERE id = :id

    RETURNING
    id,
    primary_id as primaryId,
    primary_server as primaryServer,
    name,
    secondary_id as secondaryId    
`)

contactsStmt.selectContactByPn = db.prepare(`
    SELECT
        id,
        primary_id as primaryId,
        primary_server as primaryServer,
        name,
        secondary_id as secondaryId

    FROM contacts

    WHERE secondary_id = :pn
`)

contactsStmt.selectContactByPrimaryId = db.prepare(`
    
    SELECT
        id,
        primary_id as primaryId,
        primary_server as primaryServer,
        name,
        secondary_id as secondaryId

    FROM contacts

    WHERE primary_id = :primaryId
`)

contactsStmt.selectContactById = db.prepare(`
SELECT
    id,
    primary_id as primaryId,
    primary_server as primaryServer,
    name,
    secondary_id as secondaryId
FROM contacts
WHERE id = :id
`)

export { contactsStmt }