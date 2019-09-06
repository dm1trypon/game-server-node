const Config = require('./Config');
const Loop = require('./Loop');
const CollisionObjects = require('./CollisionObjects');
const Physics = require('./Physics');
const {GAME_OBJECTS, MAX_ID} = require('./consts');
const {getRandomNumber} = require('./randomizer');

module.exports = class Core {
    constructor(events, gameObjects) {
        this.events = events;
        this.gameObjects = gameObjects;
        this.config = Config.getInstance().getConfig();
        this.defaultWeapon = '';
        this.loop = null;
        this.collisionObjects = null;

        this.setDefaultWeapon();
    }

    setDefaultWeapon() {
        const {gameSettings: {objects: {bullets}}} = this.config;

        for (const bulletsName of Object.keys(bullets)) {
            if (!bullets[bulletsName].default) {
                continue;
            }

            this.defaultWeapon = bulletsName;
        }

        if (!this.defaultWeapon.length) {
            console.log(`Error initialisate default weapon from config`);
            process.exit(-1);
        }

        console.log(`Default weapon is ${this.defaultWeapon}`);
    }

    startLoop() {
        this.loop = new Loop(this);
        this.collisionObjects = new CollisionObjects();
        this.physics = new Physics(this);
    }
    
    onTimeoutBufEffects(nickname, bufEffect) {
        console.log(`onTimeoutBufEffects(${nickname}, ${bufEffect})`);
        let players = this.gameObjects.getGameObject('players');

        for (let player of players) {
            if (player.nickname !== nickname) {
                continue;
            }

            for (const playerBufEffect of player.actingBufEffects) {
                if (playerBufEffect.name !== bufEffect) {
                    continue;
                }

                const indexBufEffect = player.actingBufEffects.indexOf(playerBufEffect);

                player.actingBufEffects.splice(indexBufEffect, 1);

                break;
            }

            break;
        }

        console.log(`Delete buf effect (${nickname}, ${bufEffect})`);

        this.gameObjects.setGameObject('players', players);
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

    createPlayer(dataObj, players) {
        const {nickname, idClient} = dataObj;
        const {gameSettings: {objects: {scene: {size: sizeScene}, players: {size: sizePlayers, speed, health}, bullets}}} = this.config;

        const {rate: rateFire} = bullets[this.defaultWeapon];
        
        let weaponNumberBullet = {};

        for (const key of Object.keys(bullets)) {
            weaponNumberBullet[key] = 0;
        }

        const actingBufEffects = [];

        const newPlayerObj = {
            nickname,
            idClient,
            health,
            weapon: this.defaultWeapon,
            posX: getRandomNumber(0, sizeScene.width),
            posY: getRandomNumber(0, sizeScene.height),
            width: sizePlayers.width,
            height: sizePlayers.height,
            speedX: 0,
            speedY: 0,
            speed,
            rateFire,
            weaponNumberBullet,
            actingBufEffects,
            score: 0,
        };

        console.log(newPlayerObj);

        players.push(newPlayerObj);

        this.gameObjects.setGameObject('players', players);
    }

    createBufEffect(bufEffect) {
        const {gameEngine: {numberBufEffects}, gameSettings: {objects: {scene: {size: sizeScene}, bufEffects}}} = this.config;
        const {size: sizeBuf, time} = bufEffects[bufEffect];

        let bufEffectsArray = this.gameObjects.getGameObject('bufEffects');

        if (bufEffectsArray.length > numberBufEffects) {
            console.log(`Limit of bufEffects objects exceeded, max: ${numberBufEffects}`);
            return;
        }

        let newBufEffect = {
            bufEffect,
            id: getRandomNumber(0, MAX_ID),
            posX: getRandomNumber(0, sizeScene.width),
            posY: getRandomNumber(0, sizeScene.height),
            width: sizeBuf.width,
            height: sizeBuf.height,
        }

        switch (bufEffect) {
            case 'medicine':
                const {health} = bufEffects[bufEffect];
                newBufEffect.health = getRandomNumber(health[0], health[1]);
                break;

            case 'boostSpeed':
                const {speed} = bufEffects[bufEffect];
                newBufEffect.time = time;
                newBufEffect.speed = getRandomNumber(speed[0], speed[1]);
                break;

            case 'boostRate':
                const {rate} = bufEffects[bufEffect];
                newBufEffect.time = time;
                newBufEffect.rate = getRandomNumber(rate[0], rate[1]);
                break;

            case 'doubleDamage':
                newBufEffect.time = time;
                break;

            case 'cartridgeBlaster':
                const {numberBullets: cb} = bufEffects[bufEffect];
                newBufEffect.numberBullets = getRandomNumber(cb[0], cb[1]);
                break;

            case 'cartridgePlazma':
            const {numberBullets: cp} = bufEffects[bufEffect];
                newBufEffect.numberBullets = getRandomNumber(cp[0], cp[1]);
                break;

            case 'cartridgeMiniGun':
                const {numberBullets: cmg} = bufEffects[bufEffect];
                newBufEffect.numberBullets = getRandomNumber(cmg[0], cmg[1]);
                break;

            case 'cartridgeShotGun':
                const {numberBullets: csg} = bufEffects[bufEffect];
                newBufEffect.numberBullets = getRandomNumber(csg[0], csg[1]);
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

    checkCollisions() {
        const players = this.gameObjects.getGameObject('players');
        const bullets = this.gameObjects.getGameObject('bullets');
        const walls = this.gameObjects.getGameObject('walls');
        const bufEffects = this.gameObjects.getGameObject('bufEffects');

        const collisionObjectsArr = this.collisionObjects.getCollisionObjects({players, bullets, walls, bufEffects});

        if (!collisionObjectsArr.length) {
            return;
        }

        const newGameObjects = this.physics.process(collisionObjectsArr, {players, bullets, walls, bufEffects});
        
        for (const key of Object.keys(newGameObjects)) {
            this.gameObjects.setGameObject(key, newGameObjects[key]);
        }
    }

    process() {
        for (const object of GAME_OBJECTS) {
            this.setPositionObjects(object);
            this.checkCollisions(object);
        }
    }

    onMouse(dataObj) {
        const {nickname, isClicked} = dataObj;

        const players = this.gameObjects.getGameObject('players');

        let playerPosX, playerPosY, isExistPlayer = false;

        for (const player of players) {
            if (nickname !== player.nickname) {
                continue;
            }

            playerPosX = player.posX;
            playerPosY = player.posY;
            isExistPlayer = true;
        }

        if (!isExistPlayer) {
            console.log(`Player ${nickname} is not exist`);
            return;
        }

        if (isClicked) {
            this.createBullet(Object.assign({playerPosX, playerPosY}, dataObj));
        }
    }

    getSpeedXY(dataObj) {
        const {bulletSize, clickPosX, clickPosY, bulletSpeed} = dataObj;

        let {playerPosX, playerPosY} = dataObj;

        playerPosX += bulletSize.width / 2;
        playerPosY += bulletSize.height / 2;

        const speedX = ((clickPosX - playerPosX) * bulletSpeed
                / Math.sqrt(Math.pow(clickPosX - playerPosX, 2) + Math.pow(clickPosY - playerPosY, 2)));

        const speedY = ((clickPosY - playerPosY) * bulletSpeed
                / Math.sqrt(Math.pow(clickPosX - playerPosX, 2) + Math.pow(clickPosY - playerPosY, 2)));

        return {speedX, speedY};
    }

    createBullet(dataObj) {
        const {nickname, clickPosX, clickPosY, playerPosX, playerPosY} = dataObj;
        const {gameSettings: {objects: {bullets}}} = this.config;
        const {speed, size, damage} = bullets[this.defaultWeapon];

        let bulletsArray = this.gameObjects.getGameObject('bullets');

        const {speedX, speedY} = this.getSpeedXY({playerPosX, playerPosY, bulletSize: size, clickPosX, clickPosY, bulletSpeed: speed});

        const newBulletObj = {
            weapon: this.defaultWeapon,
            nickname,
            idBullet: getRandomNumber(0, MAX_ID),
            posX: playerPosX,
            posY: playerPosY,
            width: size.width,
            height: size.height,
            speedX,
            speedY,
            speed,
            damage,
        }

        bulletsArray.push(newBulletObj);

        this.gameObjects.setGameObject('bullets', bulletsArray);
    }

    onCloseConnection(idClient) {
        let playersArray = this.gameObjects.getGameObject('players');

        for (const player of playersArray) {
            if (player.idClient !== idClient) {
                continue;
            }

            this.deletePlayer(playersArray.indexOf(player), playersArray);

            break;
        }
    }

    deletePlayer(indexPlayer, playersArray) {
        playersArray.splice(indexPlayer, 1);

        this.gameObjects.setGameObject('players', playersArray);
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
        const {nickname} = dataObj;

        let players = this.gameObjects.getGameObject('players');

        for (const player of players) {
            if (nickname !== player.nickname) {
                continue;
            }

            console.log(`Player already exist, nickname: ${nickname}`);

            return false;
        }

        this.createPlayer(dataObj, players);

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
}