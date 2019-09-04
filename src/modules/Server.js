const WebSocket = new require('ws');
const GameObjects = require('./GameObjects');
const WorkJson = require('./WorkJson');
const {getRandomNumber} = require('./randomizer');

module.exports = class Server {
    constructor(config) {
        this.config = config;
        this.clients = {};

        this.workJson = null;
    }

    get self() {
        return this;
    }

    start() {
        const gameObjects = new GameObjects();

        this.workJson = new WorkJson(this, gameObjects);
        this.workJson.initEvents();

        const {config: {service: {port}}} = this;

        this.server = new WebSocket.Server({port});

        console.log(`Server has been started on port ${port}`);

        this.events();
    }

    events() {
        const {workJson} = this;
        
        this.server.on('connection', (ws, req) => {
            const idClient = `${getRandomNumber(1, 100000)}`;

            this.clients[idClient] = ws;

            console.log(`Client ${idClient} has been connected to server`);

            workJson.toVerify(idClient);
          
            ws.on('message', message => {
                console.log(`Recieved message: ${message}`);
                workJson.fromData(idClient, message);
            });
          
            ws.on('close', () => {
                console.log(`Close connection from client ${idClient}`);
                workJson.onCloseConnection(idClient);
                this.disconnect(idClient);
            });
        });
    }

    disconnect(idClient) {
        if (!this.clients.hasOwnProperty(idClient)) {
            console.log(`Client ${idClient} is not connected!`);
            return;
        }

        console.log(`Disconnect client ${idClient}`);

        delete this.clients[idClient];
    }

    sendAll(data) {
        for (const idClient of Object.keys(this.clients)) {
            this.send(idClient, data);
        }
    }

    send(idClient, data) {
        const {clients} = this;

        if (!clients.hasOwnProperty(idClient)) {
            console.log(`Client ${idClient} is not connected!`);
            return;
        }

        clients[idClient].send(Buffer.from(data));
    }
}
