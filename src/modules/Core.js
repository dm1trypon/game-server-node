const Config = require('./Config');
const Loop = require('./Loop');
const CollisionObjects = require('./CollisionObjects');
const Physics = require('./Physics');
const {GAME_OBJECTS, MAX_ID} = require('./consts');
const {getRandomNumber} = require('./randomizer');

module.exports = class Core {
    constructor(events, gameObjects) {
        this.timers = [];
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
            if (bullets[bulletsName].default) {
                this.defaultWeapon = bulletsName;
                break;
            }
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

    createPlayer(dataObj, players) {
        const {nickname, idClient} = dataObj;
        const {gameSettings: {objects: {scene: {size: sizeScene}, players: {size: sizePlayers, speed, health}, bullets}}} = this.config;
        const {rate: rateFire} = bullets[this.defaultWeapon];
        const weaponNumberBullet = {};

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
            currentSpeed: 0,
            rateFire,
            weaponNumberBullet,
            actingBufEffects,
            score: 0,
        };

        players.push(newPlayerObj);

        console.log(`Creating new player: ${JSON.stringify(newPlayerObj)}`);

        this.gameObjects.setGameObject('players', players);
        this.physics.initTimer(nickname);
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
        const objectsArray = this.gameObjects.getGameObject(nameObject);

        for (let object of objectsArray) {
            object.posX += object.speedX;
            object.posY += object.speedY;
        }

        this.gameObjects.setGameObject(nameObject, objectsArray);
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

    onCloseConnection(idClient) {
        const playersArray = this.gameObjects.getGameObject('players');

        for (const player of playersArray) {
            if (player.idClient !== idClient) {
                continue;
            }

            const indexPlayer = playersArray.indexOf(player);

            if (indexPlayer === -1) {
                console.log('Unknown error in deleting player, player is not exist!');
                return;
            }

            this.physics.stopAllBufEffectsTimers(player.nickname);
            this.deletePlayer(indexPlayer, playersArray);

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
        const players = this.gameObjects.getGameObject('players');

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

        players[index].currentSpeed = 0;

        switch (key) {
            case 'up':
                if (!isHold) {
                    this.onStopSpeedY(players[index].nickname, -1);
                    return;
                }
                
                this.onStartSpeedY(players[index].nickname, 1);

                break;

            case 'down':
                if (!isHold) {
                    this.onStopSpeedY(players[index].nickname, 1);
                    return;
                }
        
                this.onStartSpeedY(players[index].nickname, -1);

                break;

            case 'left':
                if (!isHold) {
                    this.onStopSpeedX(players[index].nickname, -1);
                    return;
                }

                this.onStartSpeedX(players[index].nickname, 1);

                break;

            case 'right':
                if (!isHold) {
                    this.onStopSpeedX(players[index].nickname, 1);
                    return;
                }

                this.onStartSpeedX(players[index].nickname, -1);

                break;

            case 'up_left':
                if (!isHold) {
                    this.onStopSpeedX(players[index].nickname, - 2 / 3);
                    this.onStopSpeedY(players[index].nickname, - 2 / 3);
                    return;
                }

                this.onStartSpeedX(players[index].nickname, 2 / 3);
                this.onStartSpeedY(players[index].nickname, 2 / 3);

                break;

            case 'up_right':
                if (!isHold) {
                    this.onStopSpeedX(players[index].nickname, 2 / 3);
                    this.onStopSpeedY(players[index].nickname, - 2 / 3);
                    return;
                }

                this.onStartSpeedX(players[index].nickname, - 2 / 3);
                this.onStartSpeedY(players[index].nickname, 2 / 3);

                break;

            case 'down_left':
                if (!isHold) {
                    this.onStopSpeedX(players[index].nickname, - 2 / 3);
                    this.onStopSpeedY(players[index].nickname, 2 / 3);
                    return;
                }

                this.onStartSpeedX(players[index].nickname, 2 / 3);
                this.onStartSpeedY(players[index].nickname, - 2 / 3);

                break;

            case 'down_right':
                if (!isHold) {
                    this.onStopSpeedX(players[index].nickname, 2 / 3);
                    this.onStopSpeedY(players[index].nickname, 2 / 3);
                    return;
                }

                this.onStartSpeedX(players[index].nickname, - 2 / 3);
                this.onStartSpeedY(players[index].nickname, - 2 / 3);

                break;

            default:
                break;
        }

        this.gameObjects.setGameObject('players', players);
    }

    onStopSpeedX(nickname, coefX) {
        let players = this.gameObjects.getGameObject('players');
        let indexPlayer = -1;

        for (const playerObj of players) {
            if (playerObj.nickname !== nickname) {
                continue;
            }

            indexPlayer = players.indexOf(playerObj);

            break;
        }

        if (indexPlayer === -1) {
            console.log(`Player ${nickname} is not found in game objects!`);
            return;
        }

        if (Math.abs(players[indexPlayer].speedX - coefX) < 1) {
            players[indexPlayer].speedX = 0;
        } else {
            players[indexPlayer].speedX += coefX;
        }

        this.gameObjects.setGameObject('players', players);

        if (!players[indexPlayer].speedX) {
            return;
        }

        setTimeout(() => process.nextTick(() => this.onStopSpeedX(nickname, coefX)), 100);
    }

    onStopSpeedY(nickname, coefY) {
        let players = this.gameObjects.getGameObject('players');
        let indexPlayer = -1;

        for (const playerObj of players) {
            if (playerObj.nickname !== nickname) {
                continue;
            }

            indexPlayer = players.indexOf(playerObj);

            break;
        }

        if (indexPlayer === -1) {
            console.log(`Player ${nickname} is not found in game objects!`);
            return;
        }

        if (Math.abs(players[indexPlayer].speedY - coefY) < 1) {
            players[indexPlayer].speedY = 0;
        } else {
            players[indexPlayer].speedY += coefY;
        }

        this.gameObjects.setGameObject('players', players);

        if (!players[indexPlayer].speedY) {
            return;
        }

        setTimeout(() => process.nextTick(() => this.onStopSpeedY(nickname, coefY)), 100);
    }

    onStartSpeedX(nickname, coefX) {
        let players = this.gameObjects.getGameObject('players');
        let indexPlayer = -1;

        for (const playerObj of players) {
            if (playerObj.nickname !== nickname) {
                continue;
            }

            indexPlayer = players.indexOf(playerObj);

            break;
        }

        if (indexPlayer === -1) {
            console.log(`Player ${nickname} is not found in game objects!`);
            return;
        }

        const speed = Math.abs(players[indexPlayer].speed * coefX); // 7 

        if (Math.abs(players[indexPlayer].speedX + coefX) > speed) { 
            let newSpeed;
            
            if (coefX > 0) {
                newSpeed = 1;
            } else {
                newSpeed = -1;
            }

            players[indexPlayer].speedX = newSpeed * speed;
        } else {
            players[indexPlayer].speedX += coefX;
        }

        this.gameObjects.setGameObject('players', players);

        if (Math.abs(players[indexPlayer].speedX) === speed) {
            return;
        }

        setTimeout(() => process.nextTick(() => this.onStartSpeedX(nickname, coefX)), 100);
    }

    onStartSpeedY(nickname, coefY) {
        let players = this.gameObjects.getGameObject('players');
        let indexPlayer = -1;

        for (const playerObj of players) {
            if (playerObj.nickname !== nickname) {
                continue;
            }

            indexPlayer = players.indexOf(playerObj);

            break;
        }

        if (indexPlayer === -1) {
            console.log(`Player ${nickname} is not found in game objects!`);
            return;
        }

        const speed = Math.abs(players[indexPlayer].speed * coefY);

        if (Math.abs(players[indexPlayer].speedY + coefY) > speed) {
            let newSpeed;
            
            if (coefY > 0) {
                newSpeed = 1;
            } else {
                newSpeed = -1;
            }

            players[indexPlayer].speedY = newSpeed * speed;
        } else {
            players[indexPlayer].speedY += coefY;
        }

        this.gameObjects.setGameObject('players', players);

        if (Math.abs(players[indexPlayer].speedY) === speed) {
            return;
        }

        setTimeout(() => process.nextTick(() => this.onStartSpeedY(nickname, coefY)), 100);
    }
}
