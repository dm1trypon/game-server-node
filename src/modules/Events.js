const Core = require('./Core');
const {KEYS} = require('./consts');

module.exports = class Events {
    constructor(workJson, gameObjects) {
        this.gameObjects = gameObjects;
        this.workJson = workJson;
        this.core = null;
    }

    initCore() {
        this.core = new Core(this, this.gameObjects);
        this.core.startLoop();
    }
    
    onFpsEvent(objects) {
        this.workJson.toJsonObjects(objects);
    }

    onLoopEvent(key) {
        switch (key) {
            case 'fps':
                this.core.onFps();
                break;

            default:
                break;
        }
    }

    onMouse(dataObj) {
        this.core.onMouse(dataObj);
    }

    onKeyBoard(dataObj) {
        const {nickname, key, isHold} = dataObj;
        
        if (!KEYS.includes(key)) {
            console.log(`Unallowed key ${key}`);

            return;
        }

        this.core.controlPlayer({nickname, key, isHold});
    }

    isVerify(dataObj) {
        return this.core.isVerify(dataObj);
    }

    onCloseConnection(idClient) {
        this.core.onCloseConnection(idClient);
    }
}