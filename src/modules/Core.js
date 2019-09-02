const Config = require('./Config');
const Loop = require('./Loop');
const {GAME_OBJECTS, MAX_ID} = require('./consts');

module.exports = class Core {
    constructor(events, gameObjects) {
        this.events = events;
        this.gameObjects = gameObjects;
        this.config = Config.getInstance().getConfig();
        this.loop = null;
    }

    startLoop() {
        this.loop = new Loop(this);
    }
    
    onLoopEvent(type, bufEffect) {
        switch (type) {
            case 'fps':
                this.events.onFpsEvent(this.onNextFrame());
                break;

            case 'bufEffects':
                this.createBufEffect(bufEffect);

            default:
                break;
        }
    }

    createPlayer(nickname, players) {
        const {gameSettings: {objects: {scene: {size: sizeScene}, players: {size: sizePlayers, speed}}}} = this.config;

        const newPlayerObj = {
            nickname,
            id: this.getRandomNumber(0, MAX_ID),
            posX: this.getRandomNumber(0, sizeScene.width),
            posY: this.getRandomNumber(0, sizeScene.height),
            width: sizePlayers.width,
            height: sizePlayers.height,
            speedX: 0,
            speedY: 0,
            speed,
        }

        players.push(newPlayerObj);

        this.gameObjects.setGameObject('players', players);
    }

    createBufEffect(bufEffect) {
        const {gameSettings: {objects: {scene: {size: sizeScene}, bufEffects}}} = this.config;
        const {size: sizeBuf} = bufEffects[bufEffect];

        let bufEffectsArray = this.gameObjects.getGameObject('bufEffects');

        let newBufEffect = {
            bufEffect,
            id: this.getRandomNumber(0, MAX_ID),
            posX: this.getRandomNumber(0, sizeScene.width),
            posY: this.getRandomNumber(0, sizeScene.height),
            width: sizeBuf.width,
            height: sizeBuf.height,
        }

        switch (bufEffect) {
            case 'medicine':
                const {health} = bufEffects[bufEffect];
                newBufEffect.health = this.getRandomNumber(health[0], health[1]);
                break;

            case 'boostSpeed':
                const {speed} = bufEffects[bufEffect];
                newBufEffect.speed = this.getRandomNumber(speed[0], speed[1]);
                break;

            case 'boostRate':
                break;

            case 'doubleDamage':
                break;

            case 'cartridgeBlaster':
                break;

            case 'cartridgePlazma':
                break;

            case 'cartridgeMiniGun':
                break;

            case 'cartridgeShotGun':
                break;

            default:
                break;

        }

        bufEffectsArray.push(newBufEffect);

        this.gameObjects.setGameObject('bufEffects', bufEffectsArray);
    }

    setPositionObjects(nameObject) {
        let objects = this.gameObjects.getGameObject(nameObject);

        for (let object of objects) {
            object.posX += object.speedX;
            object.posY += object.speedY;
        }

        this.gameObjects.setGameObject(nameObject, objects);
    }

    process() {
        for (const object of GAME_OBJECTS) {
            this.setPositionObjects(object);
        }
    }

    onNextFrame() {
        this.process();

        const players = this.gameObjects.getGameObject('players');
        const bullets = this.gameObjects.getGameObject('bullets');
        const walls = this.gameObjects.getGameObject('walls');
        const bufEffects = this.gameObjects.getGameObject('bufEffects');

        return {players, bullets, walls, bufEffects};
    }

    isVerify(dataObj) {
        const {nickname, hostClient} = dataObj;

        let players = this.gameObjects.getGameObject('players');

        for (const player of players) {
            const {host, nickname} = player;

            if (host !== hostClient && nickname !== nickname) {
                continue;
            }

            return false;
        }

        this.createPlayer(nickname, players);

        return true;
    }

    controlPlayer(controlData) {
        const {nickname, key, isHold} = controlData;

        let players = this.gameObjects.getGameObject('players');
        let index = -1;

        for (const player of players) {
            if (player.nickname !== nickname) {
                continue;
            }

            index = players.indexOf(player);

            break;
        }

        if (index < 0) {
            console.log(`Player with nickname ${nickname} is not found!`);

            return;
        }

        if (!isHold) {
            players[index].speedX = 0;
            players[index].speedY = 0;

            this.gameObjects.setGameObject('players', players);

            return;
        }

        const speed = players[index].speed;

        switch (key) {
            case 'up':
                players[index].speedX = 0;
                players[index].speedY = speed;

                break;

            case 'down':
                players[index].speedX = 0;
                players[index].speedY = -speed;

                break;

            case 'left':
                players[index].speedX = -speed;
                players[index].speedY = 0;

                break;

            case 'right':
                players[index].speedX = speed;
                players[index].speedY = 0;

                break;

            case 'up_left':
                players[index].speedX = -speed * 2 / 3;
                players[index].speedY = -speed * 2 / 3;

                break;

            case 'up_right':
                players[index].speedX = speed * 2 / 3;
                players[index].speedY = -speed * 2 / 3;

                break;

            case 'down_left':
                players[index].speedX = -speed * 2 / 3;
                players[index].speedY = speed * 2 / 3;

                break;

            case 'down_right':
                players[index].speedX = speed * 2 / 3;
                players[index].speedY = speed * 2 / 3;

                break;

            default:
                break;
        }

        this.gameObjects.setGameObject('players', players);
    }

    getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
}