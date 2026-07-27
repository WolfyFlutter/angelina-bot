/**
 * @import {WAMessage} from "baileys"
 * @import {buttonSerialize} from "../types/types.js" */



/**
 * button serialize, code by wolep
 * @param {WAMessage} WAM ya wa message :v
 * @returns {buttonSerialize} button serialized
 */


const buttonSerialize = (WAM) => {
    if (!WAM) return undefined
    let kind // gak tau ngawur aja
    let id
    let displayText
    let description
    let index

    // sumpah gw gak tau cara namaiinya ini gimana, ini beberapa button yang gw ketahui,
    // sorry kalau checking value nya belum pas atau ada yang kurang

    const buttonResponseMessage = WAM?.message?.buttonsResponseMessage
    const templateButtonReplyMessage = WAM?.message?.templateButtonReplyMessage
    const nativeFlowResponseMessage = WAM?.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson

    if (buttonResponseMessage) {
        const { selectedButtonId, selectedDisplayText } = buttonResponseMessage
        kind = 'buttonResponseMessage'
        id = selectedButtonId
        displayText = selectedDisplayText
    }

    else if (templateButtonReplyMessage) {
        const { selectedId, selectedDisplayText, selectedIndex } = templateButtonReplyMessage
        kind = "templateButtonReplyMessage"
        id = selectedId
        displayText = selectedDisplayText
        index = selectedIndex
    }
    else if (nativeFlowResponseMessage) {
        try {
            const json = JSON.parse(nativeFlowResponseMessage)
            kind = "nativeFlowResponseMessage"
            id = json.id
            displayText = WAM?.message?.interactiveResponseMessage?.body?.text
            description = json.description
        } catch (e) {
            console.warn(`gagal button serialize`, e, WAM)
            return undefined
        }
    } else {
        return undefined
    }

    return {
        kind,
        id,
        displayText,
        description,
        index,
    }
}

export { buttonSerialize }