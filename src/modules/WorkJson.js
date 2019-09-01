const Events = require('./Events');

module.exports = class WorkJson {
    constructor(server, gameObjects) {
        this.server = server;
        this.gameObjects = gameObjects;
        this.events = new Events(gameObjects);
    }

    fromData(hostClient, data) {
        let dataObj;

        try {
            dataObj = JSON.parse(data);
        } catch (err) {
            console.log(err);
            return;
        }

        dataObj.hostClient = hostClient;

        this.toEvents(dataObj);
    }

    toEvents(dataObj) {
        const {method} = dataObj;
        const {events, server} = this;

        switch (method) {
            case 'mouse':
                events.onMouse(dataObj);
                break;

            case 'keyboard':
                events.onKeyBoard(dataObj);
                break;

            case 'verify':
                if (events.isVerify(dataObj)) {
                    break;
                }

                server.disconnect(dataObj.hostClient);
                break;

            default:
                break;
        }
    }

    toObjectsJson() {

    }

    toVerify(host) {
        this.server.send(host, JSON.stringify({method: 'verify'}));
    }
}