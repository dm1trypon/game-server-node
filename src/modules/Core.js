const Config = require('./Config');
const Loop = require('./Loop');
const CollisionObjects = require('./CollisionObjects');
const Physics = require('./Physics');
const { GAME_OBJECTS, MAX_ID } = require('./consts');
const { getRandomNumber } = require('./randomizer');

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
        const { gameSettings: { objects: { bullets } } } = this.config;

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

        this.createScene();
        this.wallsGenerator();
    }

    onTimeoutBufEffects(nickname, bufEffect) {
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
                break;

            default:
                break;
        }
    }

    createScene() {
        const { gameSettings: { objects: { scene: { size: { width, height } } } } } = this.config;

        let scenesArray = this.gameObjects.getGameObject('scenes');

        const newSceneObj = {
            id: getRandomNumber(0, MAX_ID),
            width,
            height,
            posX: 0,
            posY: 0,
        }

        scenesArray.push(newSceneObj);

        this.gameObjects.setGameObject('scenes', scenesArray);
    }

    createBullet(dataObj) {
        const { nickname, playerBufEffects, offsetPosX, offsetPosY, playerPosX, playerPosY, playerWidth, playerHeight, weapon } = dataObj;
        const { gameSettings: { objects: { bullets } } } = this.config;
        const { speed, size, damage, timeLife } = bullets[weapon];

        const bulletsArray = this.gameObjects.getGameObject('bullets');

        const { speedX, speedY } = this.getSpeedXY({ playerPosX, playerPosY, bulletSize: size, offsetPosX, offsetPosY, bulletSpeed: speed });

        let doubleDamage = 1;

        for (const bufEffect of playerBufEffects) {
            if (bufEffect.name === 'doubleDamage') {
                doubleDamage = 2;
            }
        }

        const newBulletObj = {
            weapon,
            nickname,
            id: getRandomNumber(0, MAX_ID),
            posX: playerPosX + playerWidth / 2 - size.width / 2,
            posY: playerPosY + playerHeight / 2 - size.height / 2,
            width: size.width,
            height: size.height,
            speedX,
            speedY,
            speed,
            damage: damage * doubleDamage,
            currentTimeLife: 0,
            timeLife,
        }

        bulletsArray.push(newBulletObj);

        this.gameObjects.setGameObject('bullets', bulletsArray);
    }

    createWall(dataObj) {
        const walls = this.gameObjects.getGameObject('walls');
        const { type, posX, posY, width, height, life } = dataObj;

        const newWall = {
            id: getRandomNumber(0, MAX_ID),
            type,
            posX,
            posY,
            life,
            width,
            height,
        };

        walls.push(newWall);

        this.gameObjects.setGameObject('walls', walls);
    }

    createPlayer(dataObj, players) {
        const { nickname, id } = dataObj;
        const {
            gameSettings: { 
                objects: { scene: { size: sizeScene }, players: { size: sizePlayers, speed, health }, bullets, walls },
            },
        } = this.config;
        const { rate: rateFire } = bullets[this.defaultWeapon];
        const weaponNumberBullet = {};

        for (const key of Object.keys(bullets)) {
            weaponNumberBullet[key] = 0;
        }

        const {
            wallLow: { size: sizeLowWall },
        } = walls;

        const { newPosX, newPosY } = this.getPositionObject({
            widthWall: sizeLowWall.width,
            heightWall: sizeLowWall.height,
            widthScene: sizeScene.width,
            heightScene: sizeScene.height
        });

        const newPlayerObj = {
            nickname,
            id,
            health,
            weapon: this.defaultWeapon,
            cursorPosition: {
                offsetPosX: 0,
                offsetPosY: 0,
            },
            posX: newPosX + (sizeLowWall.width / 2 - sizePlayers.width / 2),
            posY: newPosY + (sizeLowWall.height / 2 - sizePlayers.height / 2),
            collisionState: {
                left: false,
                right: false,
                top: false,
                bottom: false,
            },
            width: sizePlayers.width,
            height: sizePlayers.height,
            speedX: 0,
            speedY: 0,
            coefSpeedX: 0,
            coefSpeedY: 0,
            speed,
            rotate: 0,
            statusKeys: {
                up: false,
                down: false,
                left: false,
                right: false,
            },
            hasStopedX: false,
            hasStopedY: false,
            controlKeys: [],
            currentSpeed: 0,
            rateFire,
            isRateFire: true,
            weaponNumberBullet,
            actingBufEffects: [],
            score: 0,
        };

        players.push(newPlayerObj);

        console.log(`Creating new player: ${nickname}`);

        this.gameObjects.setGameObject('players', players);
        this.physics.initTimer(nickname);
        this.onPlayerControlSpeed(nickname);
    }

    createBufEffect(bufEffect) {
        const {
            gameEngine: { numberBufEffects },
            gameSettings: { objects: { scene: { size: sizeScene }, bufEffects, walls } }
        } = this.config;

        const { size: sizeBuf, time } = bufEffects[bufEffect];

        const {
            wallLow: { size: sizeLowWall },
        } = walls;

        let bufEffectsArray = this.gameObjects.getGameObject('bufEffects');

        if (bufEffectsArray.length > numberBufEffects) {
            console.log(`Limit of bufEffects objects exceeded, max: ${numberBufEffects}`);
            return;
        }

        const { newPosX, newPosY } = this.getPositionObject({
            widthWall: sizeLowWall.width,
            heightWall: sizeLowWall.height,
            widthScene: sizeScene.width,
            heightScene: sizeScene.height
        });

        let newBufEffect = {
            bufEffect,
            id: getRandomNumber(0, MAX_ID),
            posX: newPosX + sizeLowWall.width / 2 - sizeBuf.width / 2,
            posY: newPosY + sizeLowWall.height / 2 - sizeBuf.height / 2,
            width: sizeBuf.width,
            height: sizeBuf.height,
        }

        switch (bufEffect) {
            case 'medicine':
                const { health } = bufEffects[bufEffect];
                newBufEffect.health = getRandomNumber(health[0], health[1]);
                break;

            case 'boostSpeed':
                const { speed } = bufEffects[bufEffect];
                newBufEffect.time = time;
                newBufEffect.speed = getRandomNumber(speed[0], speed[1]);
                break;

            case 'boostRate':
                const { rate } = bufEffects[bufEffect];
                newBufEffect.time = time;
                newBufEffect.rate = getRandomNumber(rate[0], rate[1]);
                break;

            case 'doubleDamage':
                newBufEffect.time = time;
                break;

            case 'cartridgeBlaster':
                const { numberBullets: cb } = bufEffects[bufEffect];
                newBufEffect.numberBullets = getRandomNumber(cb[0], cb[1]);
                break;

            case 'cartridgePlazma':
                const { numberBullets: cp } = bufEffects[bufEffect];
                newBufEffect.numberBullets = getRandomNumber(cp[0], cp[1]);
                break;

            case 'cartridgeMiniGun':
                const { numberBullets: cmg } = bufEffects[bufEffect];
                newBufEffect.numberBullets = getRandomNumber(cmg[0], cmg[1]);
                break;

            case 'cartridgeShotGun':
                const { numberBullets: csg } = bufEffects[bufEffect];
                newBufEffect.numberBullets = getRandomNumber(csg[0], csg[1]);
                break;

            default:
                console.log(`Unknown bufEffect ${bufEffect}!`);
                break;
        }

        bufEffectsArray.push(newBufEffect);

        this.gameObjects.setGameObject('bufEffects', bufEffectsArray);
    }

    setPositionObjects(nameObject) {
        let objectsArray = this.gameObjects.getGameObject(nameObject);

        if (nameObject === 'bullets') {
            objectsArray = this.checkLifeBullet(objectsArray);
        }

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
        const scenes = this.gameObjects.getGameObject('scenes');

        const collisionObjectsArr = this.collisionObjects.getCollisionObjects({
            players,
            bullets,
            walls,
            bufEffects,
            scenes,
        });

        if (!collisionObjectsArr.length) {
            return;
        }

        const newGameObjects = this.physics.process(collisionObjectsArr,
            { players, bullets, walls, bufEffects, scenes });

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

    setRotationPlayer(data) {
        const {posX, posY} = data;
        const posOffsetDisplay = {widthDisplay: 400, heightDisplay: 300};

        return Math.floor(Math.atan2(posY - posOffsetDisplay.heightDisplay, posX - posOffsetDisplay.widthDisplay) * 180 / 3.14);
    }

    onMouse(dataObj) {
        const { posX, posY, nickname, isClicked } = dataObj;

        let players = this.gameObjects.getGameObject('players');
        let indexPlayer = -1;

        for (const player of players) {
            if (nickname !== player.nickname) {
                continue;
            }

            indexPlayer = players.indexOf(player);
        }

        if (indexPlayer === -1) {
            console.log(`Player ${nickname} is not exist`);
            return;
        }

        players[indexPlayer].rotation = this.setRotationPlayer({ posX, posY });

        const weapon = players[indexPlayer].weapon;

        if (players[indexPlayer].weaponNumberBullet[weapon] <= 0 && weapon !== this.defaultWeapon) {
            console.log(`Out of bullets! Weapon: ${weapon}.`);
            return;
        }

        if (isClicked && players[indexPlayer].isRateFire) {
            this.createBullet(Object.assign({
                playerPosX: players[indexPlayer].posX,
                playerPosY: players[indexPlayer].posY,
                playerWidth: players[indexPlayer].width,
                playerHeight: players[indexPlayer].height,
                playerBufEffects: players[indexPlayer].actingBufEffects,
                weapon,
            }, dataObj));

            players[indexPlayer].isRateFire = false;

            if (players[indexPlayer].weaponNumberBullet[weapon] > 0 && weapon !== this.defaultWeapon) {
                players[indexPlayer].weaponNumberBullet[weapon] --;
            }
            
            let boostRate = 0;

            for (const bufEffect of players[indexPlayer].actingBufEffects) {
                if (bufEffect.name === 'boostRate') {
                    boostRate = bufEffect.rate;
                }
            }

            this.onRateOfFireTimer(players[indexPlayer], boostRate);
        }

        this.gameObjects.setGameObject('players', players);
    }

    onRateOfFireTimer(player, boostRate) {
        setTimeout(() => { 
            if (typeof player.isRateFire === 'undefined') {
                return;
            }

            player.isRateFire = true;
        }, (player.rateFire - boostRate) * 10);
    }

    getSpeedXY(dataObj) {
        const { bulletSize, offsetPosX, offsetPosY, bulletSpeed } = dataObj;

        let { playerPosX, playerPosY } = dataObj;

        playerPosX += bulletSize.width / 2;
        playerPosY += bulletSize.height / 2;

        const speedX = ((offsetPosX - playerPosX) * bulletSpeed
            / Math.sqrt(Math.pow(offsetPosX - playerPosX, 2) + Math.pow(offsetPosY - playerPosY, 2)));

        const speedY = ((offsetPosY - playerPosY) * bulletSpeed
            / Math.sqrt(Math.pow(offsetPosX - playerPosX, 2) + Math.pow(offsetPosY - playerPosY, 2)));

        return { speedX, speedY };
    }

    onCloseConnection(id) {
        const playersArray = this.gameObjects.getGameObject('players');

        for (const player of playersArray) {
            if (player.id !== id) {
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
        const scenes = this.gameObjects.getGameObject('scenes');

        return { players, bullets, walls, bufEffects, scenes };
    }

    checkLifeBullet(bullets) {
        for (let bullet of bullets) {
            if (bullet.currentTimeLife > bullet.timeLife) {
                bullets.splice(bullets.indexOf(bullet), 1);
                continue;
            }

            bullet.currentTimeLife++;
        }

        return bullets;
    }

    isVerify(dataObj) {
        const { nickname } = dataObj;
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
        const { gameSettings: { objects: { bullets } } } = this.config;
        const { nickname, key, isHold } = controlData;

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

        switch (key) {
            case '1':
                players[index].weapon = 'blaster';
                players[index].rateFire = bullets[players[index].weapon].rate;

                this.gameObjects.setGameObject('players', players);
                return;

            case '2':
                players[index].weapon = 'plazma';
                players[index].rateFire = bullets[players[index].weapon].rate;

                this.gameObjects.setGameObject('players', players);
                return;

            default:
                break;
        }

        if (!players[index].controlKeys.includes(key) && !isHold) {
            console.log(`Player's ${nickname} key ${key} is not found for unpress!`);
            return;
        }

        if (players[index].controlKeys.includes(key) && isHold) {
            console.log(`Player's ${nickname} key ${key} already pressed!`);
            return;
        }

        if (this.isNotAcceptRulesKeys(players[index].controlKeys, key, isHold)) {
            console.log(`Key ${key} is not accept rules keys. Pressed keys: ${JSON.stringify(players[index].controlKeys)}`);
            return;
        }

        if (isHold) {
            players[index].controlKeys.push(key);
        }

        players[index] = this.motionDistribution(players[index], key, isHold);

        this.gameObjects.setGameObject('players', players);
    }

    isNotAcceptRulesKeys(keys, key, isHold) {
        return keys.includes('w') && key === 's' && isHold ||
            keys.includes('s') && key === 'w' && isHold ||
            keys.includes('d') && key === 'a' && isHold ||
            keys.includes('a') && key === 'd' && isHold;
    }

    motionDistribution(player, key, isHold) {
        if (player.controlKeys.includes('a') && player.controlKeys.length === 1) {
            player.maxSpeedX = - player.speed;
            player.maxSpeedY = 0;
        }

        if (player.controlKeys.includes('d') && player.controlKeys.length === 1) {
            player.maxSpeedX = player.speed;
            player.maxSpeedY = 0;
        }

        if (player.controlKeys.includes('w') && player.controlKeys.length === 1) {
            player.maxSpeedX = 0;
            player.maxSpeedY = - player.speed;
        }

        if (player.controlKeys.includes('s') && player.controlKeys.length === 1) {
            player.maxSpeedX = 0;
            player.maxSpeedY = player.speed;
        }

        if (player.controlKeys.includes('a') && player.controlKeys.includes('w')) {
            player.maxSpeedX = - player.speed;
            player.maxSpeedY = - player.speed;
        }

        if (player.controlKeys.includes('a') && player.controlKeys.includes('s')) {
            player.maxSpeedX = - player.speed;
            player.maxSpeedY = player.speed;
        }

        if (player.controlKeys.includes('d') && player.controlKeys.includes('w')) {
            player.maxSpeedX = player.speed;
            player.maxSpeedY = - player.speed;
        }

        if (player.controlKeys.includes('d') && player.controlKeys.includes('s')) {
            player.maxSpeedX = player.speed;
            player.maxSpeedY = player.speed;
        }

        if (!isHold) {
            player.controlKeys.splice(player.controlKeys.indexOf(key), 1);

            if (key === 'a' || key === 'd') {
                player.collisionState.left = false;
                player.collisionState.right = false;
                player.maxSpeedX = 0;
            }
            
            if (key === 'w' || key === 's') {
                player.collisionState.top = false;
                player.collisionState.bottom = false;
                player.maxSpeedY = 0;
            }
        }

        player = this.onCollisionMovement(player);

        return player;
    }

    onCollisionMovement(player) {
        const {collisionState: {left, right, bottom, top}} = player;
        
        if (left || right) {
            player.maxSpeedX = 0;
        }

        if (top || bottom) {
            player.maxSpeedY = 0;
        }

        return player;
    }

    onPlayerControlSpeed(nickname) {
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

        players[indexPlayer] = this.physics.speedControl(players[indexPlayer]);
        this.gameObjects.setGameObject('players', players);

        setTimeout(() => process.nextTick(() => this.onPlayerControlSpeed(nickname)), 50);
    }

    wallsGenerator() {
        const { gameSettings: { objects: { scene: { size: sizeScene }, walls: { numberWalls }, walls } } } = this.config;

        const {
            wallLow: { size: sizeLowWall, life: lifeLowWall },
            wallHigh: { size: sizeHighWall, life: lifeHighWall },
            wallMax: { size: sizeMaxWall, life: lifeMaxWall }
        } = walls;

        for (let wall = 0; wall < numberWalls; wall++) {
            let type = '';
            let widthWall = 0;
            let heightWall = 0;
            let wallLife = 0;

            switch (getRandomNumber(1, 4)) {
                case 1:
                    type = 'lowWall';
                    widthWall = sizeLowWall.width;
                    heightWall = sizeLowWall.height;
                    wallLife = lifeLowWall;
                    break;

                case 2:
                    type = 'highWall';
                    widthWall = sizeHighWall.width;
                    heightWall = sizeHighWall.height;
                    wallLife = lifeHighWall;
                    break;

                case 3:
                    type = 'maxWall';
                    widthWall = sizeMaxWall.width;
                    heightWall = sizeMaxWall.height;
                    wallLife = lifeMaxWall;
                    break;

                default:
                    break;
            }

            const { newPosX, newPosY } = this.getPositionObject({ widthWall, heightWall, widthScene: sizeScene.width, heightScene: sizeScene.height });

            const wallObj = {
                type,
                posX: newPosX,
                posY: newPosY,
                width: widthWall,
                height: heightWall,
                life: wallLife,
            };

            this.createWall(wallObj);
        }
    }

    getPositionObject(dataObj) {
        const walls = this.gameObjects.getGameObject('walls');

        const { widthWall, heightWall, widthScene, heightScene } = dataObj;

        const posX = getRandomNumber(0, widthScene);
        const posY = getRandomNumber(0, heightScene);

        const maxWallsWidth = Math.floor(posX / widthWall);
        const maxWallsHeight = Math.floor(posY / heightWall);

        const newPosX = maxWallsWidth * widthWall;
        const newPosY = maxWallsHeight * heightWall;

        if (newPosX + widthWall >= widthScene) {
            return this.getPositionObject(dataObj);
        }

        if (newPosY + heightWall >= heightScene) {
            return this.getPositionObject(dataObj);
        }

        for (const wall of walls) {
            const { posX, posY } = wall;

            if (posX === newPosX && posY === newPosY) {
                return this.getPositionObject(dataObj);
            }
        }

        return { newPosX, newPosY };
    }
}
