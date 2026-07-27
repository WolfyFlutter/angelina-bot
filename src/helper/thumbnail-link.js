import { prepareWAMessageMedia, proto } from "baileys"

/**
 * @import {WASocket, AnyMediaMessageContent, WAMessageContent} from "baileys"
 */

/**
 * @typedef {object} ThumbnailContent
 * @property {string} url
 * @property {string} title
 * @property {string} description
 * @property {string} text
 */

/**
 * @param {WASocket} sock
 * @param {AnyMediaMessageContent} anyMediaMessageContent
 * @param {ThumbnailContent} [thumbnailContent]
 * @returns {Promise<WAMessageContent>}
 */

const createThumbnailLink = async (sock, anyMediaMessageContent, thumbnailContent = {}) => {
    const {
        text = "text",
        description = "description",
        title = "title",
        url = "https://example.com/"
    } = thumbnailContent

    const { imageMessage: i } = await prepareWAMessageMedia(
        anyMediaMessageContent,
        {
            upload: sock.waUploadToServer,
            mediaTypeOverride: 'thumbnail-link'
        })

    const message_obj = {
        extendedTextMessage: {
            "title": title,
            "description": description,
            "text": url + '\n' + text,
            "matchedText": url,

            "previewType": "NONE",
            "inviteLinkGroupTypeV2": "DEFAULT",

            "thumbnailDirectPath": i.directPath,
            "thumbnailSha256": i.fileSha256,
            "thumbnailEncSha256": i.fileEncSha256,
            "mediaKey": i.mediaKey,
            "mediaKeyTimestamp": i.mediaKeyTimestamp,

            "thumbnailWidth": i.width,
            "thumbnailHeight": i.height,

            // ripped original jpeg thumbnail
            "jpegThumbnail": "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAQAAAAnOwc2AAAADElEQVR4nGNgGG4AAADSAAFQmYCvAAAAAElFTkSuQmCC",

            // todo 
            // "faviconMMSMetadata": {
            //     "thumbnailDirectPath": "/v/t62.36144-24/672851390_1065178862745308_6747763751342821857_n.enc?ccb=11-4&oh=01_Q5Aa5AEGdY9defa7Fx-IFmABnJb6jBPdnVnzmOtMAy6z-Aq0Wg&oe=6A7D6A66&_nc_sid=5e03e0",
            //     "thumbnailSha256": "mbRZf1uTEgmarC3L6SuVL8/aLSAwwS07ssk0ylftG8Q=",
            //     "thumbnailEncSha256": "+TfK20KfxTos6Gv8RX3Q1T0nF+bIV4a4nKMCUuxW45E=",
            //     "mediaKey": "YZUhXU140TvwzXldsctdlrZHcjr8b37QSxyp9x2hCws=",
            //     "mediaKeyTimestamp": "1784021674",
            //     "thumbnailHeight": 48,
            //     "thumbnailWidth": 48
            // }
        }
    }
    const wamc = proto.Message.fromObject(message_obj)
    return wamc
}

export { createThumbnailLink }