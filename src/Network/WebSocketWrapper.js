class NetworkEvent {
    constructor(type, message) {
        this.type = type;
        this.message = message;
    }
}

export default class WebSocketWrapper {
    constructor() {
        this.connected = false;
        this.listenerNextId = 0;
        this.listeners = {};
    }

    sendMessage(message) {
        if (this.connected) {
            this.ws.send(message);
        }
    }

    addListener(listener, type = undefined) {
        let listenerId = this.listenerNextId;
        this.listenerNextId++;
        this.listeners[listenerId] = {
            'listener': listener,
            'type': type,
        };
        return listenerId;
    }

    removeListener(index) {
        delete this.listeners[index];
    }

    socketOpen(event) {
        console.log(event);
        this.connected = true;
        this.distributeEvent('open');
    }

    socketMessage(event) {
        console.log(event);
        this.distributeEvent('message');
    }

    socketError(event) {
        console.log(event);
    }

    socketClose(event) {
        console.log(event);
        this.connected = false;
        this.distributeEvent('close');
        this.tryReopen();
    }

    tryReopen() {
    }

    distributeEvent(type, message = null) {
        const event = new NetworkEvent(type, message);
        for (let listenerId in this.listeners) {
            let listener = this.listeners[listenerId];
            if (
                (listener['type'] === undefined || listener['type'] === type)
                && (listener['message'] === undefined || listener['message'] === message)
                && (listener['direction'] === undefined || listener['direction'] === type)
            ) {
                listener['listener'](event);
            }
        }
    }
}