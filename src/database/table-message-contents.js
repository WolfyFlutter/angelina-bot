import { db } from "./database.js";

// create table message_content

db.exec(`
    CREATE TABLE IF NOT EXISTS message_contents(
    id INTEGER PRIMARY KEY,
    content TEXT UNIQUE)
    `)

// add value
db.exec(`
    INSERT OR IGNORE
    INTO message_contents (content)
    VALUES
    ('extendedTextMessage'),
    ('conversation'),
    ('stickerMessage'),
    ('imageMessage'),
    ('reactionMessage'),
    ('protocolMessage'),
    ('videoMessage'),
    ('audioMessage'),
    ('pinInChatMessage'),
    ('interactiveResponseMessage'),
    ('interactiveMessage'),
    ('albumMessage'),
    ('groupStatusMentionMessage'),
    ('documentMessage'),
    ('buttonsMessage'),
    ('groupInviteMessage'),
    ('buttonsResponseMessage'),
    ('botInvokeMessage'),
    ('stickerPackMessage'),
    ('pollResultSnapshotMessage'),
    ('lottieStickerMessage'),
    ('templateButtonReplyMessage'),
    ('ptvMessage'),
    ('keepInChatMessage'),
    ('groupStatusMessageV2'),
    ('contactMessage'),
    ('pollUpdateMessage'),
    ('associatedChildMessage'),
    ('productMessage'),
    ('messageStubType'),
    ('editedMessage'),
    ('eventMessage'),
    ('encEventResponseMessage'),
    ('requestPaymentMessage'),
    ('orderMessage'),
    ('pollCreationMessageV3'),
    ('locationMessage'),
    ('requestPhoneNumberMessage'),
    ('contactsArrayMessage'),
    ('listMessage'),
    ('listResponseMessage'),
    ('templateMessage'),
    ('liveLocationMessage'),
    ('pollCreationMessage'),
    ('newsletterAdminInviteMessage'),
    ('pollCreationMessageV5'),
    ('viewOnceMessage'),
    ('paymentInviteMessage'),
    ('scheduledCallCreationMessage'),
    ('pollCreationMessageV2'),
    ('newsletterFollowerInviteMessageV2'),
    ('declinePaymentRequestMessage'),
    ('secretEncryptedMessage'),
    ('richResponseMessage'),
    ('botForwardedMessage'),
    ('placeholderMessage'),
    ('commentMessage'),
    ('bcallMessage'),
    ('pollCreationMessageV4'),
    ('encCommentMessage'),
    ('encReactionMessage'),
    ('questionMessage'),
    ('statusQuestionAnswerMessage'),
    ('statusStickerInteractionMessage'),
    ('sendPaymentMessage'),
    ('statusMentionMessage')
`)

const stmtMessageContents = {}

stmtMessageContents.selectAll = db.prepare(`
    SELECT * FROM message_contents`)

stmtMessageContents.insert = db.prepare(`
    INSERT INTO message_contents (content)
    VALUES (:content)`)

stmtMessageContents.getContentById = db.prepare(`
    SELECT * FROM message_contents where id = :id`)

export { stmtMessageContents }