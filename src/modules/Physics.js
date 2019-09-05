const Config = require('./Config');

module.exports = class Physics {
    constructor(defaultWeapon) {
        this.config = Config.getInstance().getConfig();
        this.defaultWeapon = defaultWeapon;
    }

    process(collisionObjects, gameObjects) {
        for (const colObject of collisionObjects) {
            const {nameOne, nameTwo} = colObject;
            const objectsNames = [nameOne, nameTwo];

            gameObjects = this.rules(colObject, gameObjects, objectsNames);
        }

        return gameObjects;
    }

    rules(colObject, gameObjects, objectsNames) {
        const type = `${objectsNames[0]}_${objectsNames[1]}`;

        console.log(type);

        switch (type) {
            case 'player_bufEffect':
                return this.onPlayerBufEffectCollision(colObject, gameObjects);

            case 'player_player':
                break;

            case 'player_bullet':
                return this.onPlayerBulletCollision(colObject, gameObjects);

            case 'player_wall':
                break;

            default:
                break;
        }
    }

    onPlayerBulletCollision(colObject, gameObjects) {
        const {gameSettings: {objects: {scene: {size: sizeScene}, players: {speed, health}}}} = this.config;

        let {bullets, players} = gameObjects;

        const bullet = colObject.objectTwo;
        const player = colObject.objectOne;

        const indexPlayer = players.indexOf(player);
        
        if (indexPlayer === -1) {
            console.log(`Player is not exists!`);
            return gameObjects;
        }

        const indexBullet = bullets.indexOf(bullet);

        if (indexBullet === -1) {
            console.log(`Buf effect is not exists!`);
            return gameObjects;
        }

        if (bullet.nickname === player.nickname) {
            return gameObjects;
        }

        players[indexPlayer].health -= bullets[indexBullet].damage;
        bullets[indexBullet].damage -= players[indexPlayer].health;

        if (players[indexPlayer].health < 1) {
            players[indexPlayer].health = health;
            players[indexPlayer].speed = speed;
            players[indexPlayer].weapon = this.defaultWeapon;
            players[indexPlayer].posX = getRandomNumber(0, sizeScene.width);
            players[indexPlayer].posY = getRandomNumber(0, sizeScene.height);
        }

        if (bullets[indexBullet].damage < 1) {
            bullets.splice(indexBullet, 1);
        }

        gameObjects.players = players;
        gameObjects.bullets = bullets;
        
        return gameObjects;
    }

    onPlayerBufEffectCollision(colObject, gameObjects) {
        let {bufEffects, players} = gameObjects;

        const bufEffect = colObject.objectTwo;
        const indexBufEffect = bufEffects.indexOf(bufEffect);

        if (indexBufEffect === -1) {
            console.log(`Buf effect is not exists!`);
            return;
        }

        bufEffects.splice(indexBufEffect, 1);
        gameObjects.bufEffects = bufEffects;
        
        return gameObjects;
    }
}