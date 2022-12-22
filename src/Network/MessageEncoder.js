class Message {
    constructor(type, object) {
        this.type = type;
        this.object = object;
    }

    escape(str) {
        return str.replace(/#/g, '##').replace(/(>|<)/g, '#$1');
    }

    encode() {
        return this.escape(this.type) + '>' + this.escape(JSON.stringify(this.object));
    }
}

export class DecodingError {
}

export default class MessageEncoder {
    encode(messages) {
        let encoded = '';
        for (let message of messages) {
            if (encoded !== '') {
                encoded += '<';
            }
            encoded += message.escape();
        }
        return encoded;
    }

    unescape(str) {
        return str.replace(/#(>|<)/g, '$1').replace(/##/g, '#');
    }

    decode(messageString) {
        const result = [];
        // Split by < but only if not preceeded by # (# escapes the <)
        for (let message of messageString.split(/[^#](##)*<|^</)) {
            const parts = messageString.split(/[^#](##)*>|^</);
            if (parts.length === 2) {
                result.push(createMessage(this.unescape(parts[0]), JSON.decode(this.unescape(parts[1]))));
            } else {
                throw new DecodingError();
            }
        }
        return result;
    }

    createMessage(type, object) {
        return new Message(type, object);
    }
}