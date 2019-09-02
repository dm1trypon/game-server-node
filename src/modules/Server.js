const WebSocket = new require('ws');
const GameObjects = require('./GameObjects');
const WorkJson = require('./WorkJson');

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
            const hostClient = req.connection.remoteAddress;

            this.clients[hostClient] = ws;

            console.log(`Client has been connected to server from ${hostClient}`);

            workJson.toVerify(hostClient);
          
            ws.on('message', message => {
                console.log(`Recieved message: ${message}`);
                workJson.fromData(hostClient, message);
            });
          
            ws.on('close', () => {
                console.log(`Close connection from ${hostClient}`);
            });
        });
    }

    disconnect(hostClient) {
        if (!clients.hasOwnProperty(hostClient)) {
            console.log(`Client ${hostClient} is not connected!`);
            return;
        }

        delete this.clients[hostClient];
    }

    sendAll(data) {
        for (const hostClient of Object.keys(this.clients)) {
            this.send(hostClient, data);
        }
    }

    send(hostClient, data) {
        const {clients} = this;

        if (!clients.hasOwnProperty(hostClient)) {
            console.log(`Client ${hostClient} is not connected!`);
            return;
        }

        clients[hostClient].send(data);
    }
}
