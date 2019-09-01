const Core = require('./Core');

module.exports = class Events {
    constructor(gameObjects) {
        this.gameObjects = gameObjects;
        this.core = new Core(gameObjects);
    }

    onMouse(dataObj) {
        const {nickname, posX, posY, offsetX, offsetY, isClicked} = dataObj;

    }

    onKeyBoard(dataObj) {
        const {nickname, key, hold} = dataObj;
        
    }

    isVerify(dataObj) {
        return this.core.isVerify(dataObj);
    }

    onDisconnect(hostClient) {

    }

}