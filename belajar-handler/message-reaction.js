/**
 * @param {import('baileys').BaileysEventMap['messages.reaction']} bems
 */

async function messageReaction(sock, bems) {
    for (let i = 0; i < bems.length; i++) {
        console.log(bems[i])
    }
}

export default messageReaction