const WebSocketClient = require('websocket').client;
const uuidv4 = require('uuid/v4');

const {
    onVerify,
    onMouse,
} = require('./cases/events');

const {
    onUpKeyboardUp,
    onUpKeyboardDown,
    onUpKeyboardLeft,
    onUpKeyboardRight,
    onUpKeyboardUpRight,
    onUpKeyboardUpLeft,
    onUpKeyboardDownRight,
    onUpKeyboardDownLeft,
} = require('./cases/onKeyUp');

const {
    onDownKeyboardUp,
    onDownKeyboardDown,
    onDownKeyboardLeft,
    onDownKeyboardRight,
    onDownKeyboardUpRight,
    onDownKeyboardUpLeft,
    onDownKeyboardDownRight,
    onDownKeyboardDownLeft,
} = require('./cases/onKeyDown');

module.exports = class Client {
    constructor(host, port) {
        this.tick = 0;
        this.onKeyUpMethods = [onUpKeyboardUp, onUpKeyboardDown, onUpKeyboardLeft, onUpKeyboardRight,
            onUpKeyboardUpRight, onUpKeyboardUpLeft, onUpKeyboardDownRight, onUpKeyboardDownLeft];

        this.onKeyDownMethods = [onDownKeyboardUp, onDownKeyboardDown, onDownKeyboardLeft, onDownKeyboardRight,
            onDownKeyboardUpRight, onDownKeyboardUpLeft, onDownKeyboardDownRight, onDownKeyboardDownLeft];

        this.client = new WebSocketClient();
        this.connect(host, port);
    }

    onDownKeyPress(tick, nickname, connection) {
        this.onKeyDownMethods[tick].nickname = nickname;
        connection.sendUTF(JSON.stringify(this.onKeyDownMethods[tick]));
    }

    startTimer(connection) {
        const nickname = uuidv4();

        let verifyObj = onVerify;
        verifyObj.nickname = nickname;

        connection.sendUTF(JSON.stringify(verifyObj));

        setInterval(() => {
            this.onKeyUpMethods[this.tick].nickname = nickname;
            connection.sendUTF(JSON.stringify(this.onKeyUpMethods[this.tick]));

            const tick = this.tick;

            setTimeout(() => this.onDownKeyPress(tick, nickname, connection), 2000);

            this.tick ++;

            if (this.tick < 8) {
                return;
            }

            this.tick = 0;
        }, 3000);

        setInterval(() => {
            this.onKeyUpMethods[this.tick].nickname = nickname;
            connection.sendUTF(JSON.stringify(this.onKeyUpMethods[this.tick]));

            const tick = this.tick;

            setTimeout(() => this.onDownKeyPress(tick, nickname, connection), 1000);

            this.tick ++;

            if (this.tick < 8) {
                return;
            }

            this.tick = 0;
        }, 2000);

        setInterval(() => {
            this.onKeyUpMethods[this.tick].nickname = nickname;
            connection.sendUTF(JSON.stringify(this.onKeyUpMethods[this.tick]));

            const tick = this.tick;

            setTimeout(() => this.onDownKeyPress(tick, nickname, connection), 500);

            this.tick ++;

            if (this.tick < 8) {
                return;
            }

            this.tick = 0;
        }, 1000);

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
