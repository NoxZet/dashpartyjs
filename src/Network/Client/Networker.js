import WebSocketWrapper from "Network/WebSocketWrapper";

const PROTOCOL = 'submarine';

export default class Networker extends WebSocketWrapper {
    constructor() {
        super();
        this.wsAddress = 'ws://' + location.host + '/';
        this.expectDisconnect = false;
        this.establishConnection();
    }

    establishConnection() {
        this.ws = new WebSocket(this.wsAddress, PROTOCOL);
        console.log(this.ws);
        this.ws.addEventListener('open', this.messageListener = (event) => this.socketOpen(event));
        this.ws.addEventListener('message', this.messageListener = (message) => this.socketMessage(message));
        this.ws.addEventListener('error', this.errorListener = (error) => this.socketOpen(error));
        this.ws.addEventListener('close', this.closeListener = (close) => this.socketClose(close));
    }

    tryReopen() {
        if (!this.expectDisconnect) {
            this.establishConnection();
        }
    }
}
