import WebSocket, { WebSocketServer } from 'ws';
import WebSocketWrapper from 'Network/WebSocketWrapper';
const PROTOCOL = 'submarine';

class NetworkUser extends WebSocketWrapper {
    constructor(networker, userId, ws) {
        super();
        this.networker = networker;
        this.userId = userId;
        this.ws = ws;
        this.expectDisconnect = false;
        this.establishConnection();
    }

    establishConnection() {
        console.log(this.ws);
        this.ws.addEventListener('message', this.messageListener = (message) => this.socketMessage(message));
        this.ws.addEventListener('error', this.errorListener = (error) => this.socketOpen(error));
        this.ws.addEventListener('close', this.closeListener = (close) => this.socketClose(close));
    }
}

export default class Networker {
    constructor(httpServer, onOpen) {
        this.onOpen = onOpen;
        this.wsServer = new WebSocketServer({
            server: httpServer,
        });
        this.userNextId = 0;
        this.users = {};
        this.wsServer.on('connection', (ws) => this.socketConnection(ws));
    }

    socketConnection(webSocket) {
        console.log('connection');
        if (webSocket.protocol !== PROTOCOL) {
            webSocket.close();
        }
        let userId = this.userNextId;
        this.userNextId++;
        let networkUser = new NetworkUser(this, userId, webSocket);
        this.users[userId] = networkUser;
        if (typeof this.onOpen === 'function') {
            this.onOpen(networkUser);
        }
    }
}
