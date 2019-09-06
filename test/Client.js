const WebSocketClient = require('websocket').client;
const uuidv4 = require('uuid/v4');

const {
    onKeyboardLeft,
    onKeyboardRight,
    onKeyboardUp,
    onKeyboardDown, 
    onKeyboardUpRight,
    onKeyboardUpLeft,
    onKeyboardDownRight,
    onKeyboardDownLeft,
    onMouse,
    onVerify,
} = require('./cases/methods');

module.exports = class Client {
    constructor(host, port) {
        this.tick = 0;
        this.methods = [onKeyboardLeft, onKeyboardRight, onKeyboardUp, onKeyboardDown,
            onKeyboardUpRight, onKeyboardUpLeft, onKeyboardDownRight, onKeyboardDownLeft, onMouse];

        this.client = new WebSocketClient();
        this.connect(host, port);
    }

    startTimer(connection) {
        const nickname = uuidv4();

        let verifyObj = onVerify;
        verifyObj.nickname = nickname;

        connection.sendUTF(JSON.stringify(verifyObj));

        setInterval(() => {
            this.methods[this.tick].nickname = nickname;
            connection.sendUTF(JSON.stringify(this.methods[this.tick]));

            this.tick ++;

            if (this.tick < 8) {
                return;
            }

            this.tick = 0;
        }, 3000);

        // setInterval(() => {
        //     this.methods[8].nickname = nickname;
        //     connection.sendUTF(JSON.stringify(this.methods[8]));
        // }, 1000);
    }

    connect(host, port) {
        this.client.connect(`ws://${host}:${port}/`);
        this.setEvents();
    }

    setEvents() {
        this.client.on('connectFailed', error => {
            console.log(`Connect Error: ${error.toString()}`);
        });
         
        this.client.on('connect', connection => {
            console.log('WebSocket Client Connected');

            this.startTimer(connection);

            connection.on('error', error => {
                console.log(`Connection Error: ${error.toString()}`);
            });

            connection.on('close', () => {
                console.log('Connection closed');
            });

            connection.on('message', message => {
                console.log(`Received: ${message.binaryData.toString('utf8')}`);
            });
        });
    }
}
