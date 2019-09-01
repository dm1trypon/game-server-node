const Config = require('./Config');

module.exports = class Core {
    constructor(gameObjects) {
        this.gameObjects = gameObjects;
        this.config = Config.getInstance();
    }

    isVerify(dataObj) {
        const {gameSettings: {objects: {scene: {size: sizeScene}, players: {size: sizePlayers, speed}}}} = this.config.getConfig();
        const {nickname, hostClient} = dataObj;

        console.log(this.gameObjects);
        let players = this.gameObjects.getGameObject('players');

        for (const player of players) {
            const {host, nickname} = player;

            if (host !== hostClient && nickname !== nickname) {
                continue;
            }

            return false;
        }

        const newPlayerObj = {
            nickname,
            id: this.getRandomNumber(0, 100000),
            posX: this.getRandomNumber(0, sizeScene.width),
            posY: this.getRandomNumber(0, sizeScene.height),
            width: sizePlayers.width,
            height: sizePlayers.height,
            speed,
        }

        players.push(newPlayerObj);

        this.gameObjects.setGameObject('players', players);

        console.log(`Player has been created!`);
        console.log(newPlayerObj);

        return true;
    }

    getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
}