const Config = require('./Config');
const { getRandomNumber } = require('./randomizer');

module.exports = class Physics {
    constructor(core) {
        const { defaultWeapon } = core;
        this.core = core;
        this.config = Config.getInstance().getConfig();
        this.defaultWeapon = defaultWeapon;
        this.timers = [];
    }

    process(collisionObjects, gameObjects) {
        for (const colObject of collisionObjects) {
            const { nameOne, nameTwo } = colObject;
            const objectsNames = [nameOne, nameTwo];

            gameObjects = this.rules(colObject, gameObjects, objectsNames);
        }

        return gameObjects;
    }

    rules(colObject, gameObjects, objectsNames) {
        const type = `${objectsNames[0]}_${objectsNames[1]}`;

        switch (type) {
            case 'player_bufEffect':
                return this.onPlayerBufEffectCollision(colObject, gameObjects);

            case 'player_player':
                return this.onPlayersCollision(colObject, gameObjects);

            case 'player_bullet':
                return this.onPlayerBulletCollision(colObject, gameObjects);

            case 'player_wall':
                return this.onPlayerWallCollision(colObject, gameObjects);

            case 'player_scene':
                return this.onPlayerSceneCollision(colObject, gameObjects);

            case 'bullet_scene':
                return this.onBulletSceneCollision(colObject, gameObjects);

            case 'bullet_wall':
                return this.onBulletWallCollision(colObject, gameObjects);

            case 'bullet_bullet':
                return this.onBulletsCollision(colObject, gameObjects);

            default:
                break;
        }
    }

    onPlayerWallCollision(colObject, gameObjects) {
        let { players, walls } = gameObjects;

        const wall = colObject.objectTwo;
        const player = colObject.objectOne;

        const indexPlayer = players.indexOf(player);

        if (indexPlayer === -1) {
            console.log(`Player is not exists!`);
            return gameObjects;
        }

        const indexWall = walls.indexOf(wall);

        if (indexWall === -1) {
            console.log(`Wall is not exists!`);
            return gameObjects;
        }

        if (Math.abs(players[indexPlayer].posX - walls[indexWall].posX) > Math.abs(players[indexPlayer].posY - walls[indexWall].posY)) {
            if (players[indexPlayer].posX + players[indexPlayer].width > walls[indexWall].posX + walls[indexWall].width / 2) {
                players[indexPlayer].speedX *= -1;
                players[indexPlayer].speedX--;
                players[indexPlayer].posX = walls[indexWall].posX + walls[indexWall].width;

                // if (Math.abs(players[indexPlayer].speedX) <= 1) {
                //     players[indexPlayer].posX = walls[indexWall].posX + walls[indexWall].width;
                //     players[indexPlayer].maxSpeedX = 0;
                //     players[indexPlayer].speedX = 0;
                // }

                gameObjects.players = players;

                return gameObjects;
            }

            if (players[indexPlayer].posX + players[indexPlayer].width < walls[indexWall].posX + walls[indexWall].width / 2) {
                players[indexPlayer].speedX *= -1;
                players[indexPlayer].speedX++;
                players[indexPlayer].posX = walls[indexWall].posX - players[indexPlayer].width;

                // if (Math.abs(players[indexPlayer].speedX) <= 1) {
                //     players[indexPlayer].posX = walls[indexWall].posX - players[indexPlayer].width;
                //     players[indexPlayer].maxSpeedX = 0;
                //     players[indexPlayer].speedX = 0;
                // }

                gameObjects.players = players;

                return gameObjects;
            }

            gameObjects.players = players;

            return gameObjects;
        }

        if (Math.abs(players[indexPlayer].posX - walls[indexWall].posX) < Math.abs(players[indexPlayer].posY - walls[indexWall].posY)) {
            if (players[indexPlayer].posY + players[indexPlayer].height > walls[indexWall].posY + walls[indexWall].height / 2) {
                players[indexPlayer].speedY *= -1;
                players[indexPlayer].speedY--;
                players[indexPlayer].posY = walls[indexWall].posY + walls[indexWall].height;

                // if (Math.abs(players[indexPlayer].speedY) <= 1) {
                //     players[indexPlayer].posY = walls[indexWall].posY + walls[indexWall].height;
                //     players[indexPlayer].maxSpeedY = 0;
                //     players[indexPlayer].speedY = 0;
                // }

                gameObjects.players = players;

                return gameObjects;
            }

            if (players[indexPlayer].posY + players[indexPlayer].height < walls[indexWall].posY + walls[indexWall].height / 2) {
                players[indexPlayer].speedY *= -1;
                players[indexPlayer].speedY++;
                players[indexPlayer].posY = walls[indexWall].posY - players[indexPlayer].height;

                // if (Math.abs(players[indexPlayer].speedY) <= 1) {
                //     players[indexPlayer].posY = walls[indexWall].posY - players[indexPlayer].height;
                //     players[indexPlayer].maxSpeedY = 0;
                //     players[indexPlayer].speedY = 0;
                // }

                gameObjects.players = players;

                return gameObjects;
            }

            gameObjects.players = players;

            return gameObjects;
        }

        gameObjects.players = players;

        return gameObjects;
    }

    onBulletSceneCollision(colObject, gameObjects) {
        let { bullets, scenes } = gameObjects;

        const bullet = colObject.objectOne;
        const scene = colObject.objectTwo;

        const indexBullet = bullets.indexOf(bullet);

        if (indexBullet === -1) {
            console.log(`Bullet is not exists!`);
            return gameObjects;
        }

        const indexScene = scenes.indexOf(scene);

        if (indexScene === -1) {
            console.log(`Wall is not exists!`);
            return gameObjects;
        }

        bullets.splice(indexBullet, 1);

        gameObjects.bullets = bullets;

        return gameObjects;
    }

    onBulletWallCollision(colObject, gameObjects) {
        let { bullets, walls } = gameObjects;

        const bullet = colObject.objectOne;
        const wall = colObject.objectTwo;

        const indexBullet = bullets.indexOf(bullet);

        if (indexBullet === -1) {
            console.log(`Bullet is not exists!`);
            return gameObjects;
        }

        const indexWall = walls.indexOf(wall);

        if (indexWall === -1) {
            console.log(`Scene is not exists!`);
            return gameObjects;
        }

        walls[indexWall].life -= bullets[indexBullet].damage;

        if (walls[indexWall].life <= 0) {
            walls.splice(indexWall, 1);
        }

        bullets.splice(indexBullet, 1);

        gameObjects.bullets = bullets;
        gameObjects.walls = walls;

        return gameObjects;
    }

    onBulletsCollision(colObject, gameObjects) {
        let { bullets } = gameObjects;

        const bulletOne = colObject.objectTwo;
        const bulletTwo = colObject.objectOne;

        const indexBulletOne = bullets.indexOf(bulletOne);

        if (indexBulletOne === -1) {
            console.log(`Player is not exists!`);
            return gameObjects;
        }

        const indexBulletTwo = bullets.indexOf(bulletTwo);

        if (indexBulletTwo === -1) {
            console.log(`Player is not exists!`);
            return gameObjects;
        }

        if (bulletOne.nickname === bulletTwo.nickname) {
            return gameObjects;
        }

        const damageOne = bullets[indexBulletOne].damage;
        const damageTwo = bullets[indexBulletTwo].damage;

        bullets[indexBulletOne].damage -= damageOne;
        bullets[indexBulletTwo].damage -= damageTwo;

        if (bullets[indexBulletOne].damage <= 0) {
            bullets.splice(indexBulletOne, 1);
        }

        if (bullets[indexBulletTwo].damage <= 0) {
            bullets.splice(indexBulletTwo, 1);
        }

        gameObjects.bullets = bullets;

        return gameObjects;
    }

    onPlayersCollision(colObject, gameObjects) {
        let { players } = gameObjects;

        const playerOne = colObject.objectTwo;
        const playerTwo = colObject.objectOne;

        const indexPlayerOne = players.indexOf(playerOne);

        if (indexPlayerOne === -1) {
            console.log(`Player is not exists!`);
            return gameObjects;
        }

        const indexPlayerTwo = players.indexOf(playerTwo);

        if (indexPlayerTwo === -1) {
            console.log(`Player is not exists!`);
            return gameObjects;
        }

        if (playerOne.nickname === playerTwo.nickname) {
            return gameObjects;
        }

        players[indexPlayerOne].posX += -2 * players[indexPlayerOne].speedX;
        players[indexPlayerOne].posY += -2 * players[indexPlayerOne].speedY;

        gameObjects.players = players;

        return gameObjects;
    }

    onPlayerSceneCollision(colObject, gameObjects) {
        let { players, scenes } = gameObjects;

        const scene = colObject.objectTwo;
        const player = colObject.objectOne;

        const indexPlayer = players.indexOf(player);

        if (indexPlayer === -1) {
            console.log(`Player is not exists!`);
            return gameObjects;
        }

        const indexScene = scenes.indexOf(scene);

        if (indexScene === -1) {
            console.log(`Scene is not exists!`);
            return gameObjects;
        }

        if (players[indexPlayer].posX < scenes[indexScene].posX && players[indexPlayer].maxSpeedX < 0) {
            if (!players[indexPlayer].statusKeys.left && !players[indexPlayer].statusKeys.right) {
                players[indexPlayer].coefSpeedX *= -1;
            }

            if (players[indexPlayer].speedX > 0) {
                players[indexPlayer].speedX--;
            } else {
                players[indexPlayer].speedX++;
            }

            players[indexPlayer].speedX = players[indexPlayer].speedX * (-1) + players[indexPlayer].coefSpeedX;
            players[indexPlayer].posX = scenes[indexScene].posX;
        }

        if (players[indexPlayer].posX + players[indexPlayer].width > scenes[indexScene].posX + scenes[indexScene].width) {
            if (!player.statusKeys.left && !player.statusKeys.right) {
                player.coefSpeedX *= -1;
            }

            if (players[indexPlayer].speedX > 0) {
                players[indexPlayer].speedX--;
            } else {
                players[indexPlayer].speedX++;
            }

            players[indexPlayer].speedX = players[indexPlayer].speedX * (-1) + players[indexPlayer].coefSpeedX;
            players[indexPlayer].posX = scenes[indexScene].posX + scenes[indexScene].width - players[indexPlayer].width;
        }

        if (players[indexPlayer].posY < scenes[indexScene].posY) {
            if (!players[indexPlayer].statusKeys.up && !players[indexPlayer].statusKeys.down) {
                players[indexPlayer].coefSpeedY *= -1;
            }

            if (players[indexPlayer].speedY > 0) {
                players[indexPlayer].speedY--;
            } else {
                players[indexPlayer].speedY++;
            }

            players[indexPlayer].speedY = players[indexPlayer].speedY * (-1) + players[indexPlayer].coefSpeedY;
            players[indexPlayer].posY = scenes[indexScene].posY;
        }

        if (players[indexPlayer].posY + players[indexPlayer].height > scenes[indexScene].posY + scenes[indexScene].height) {
            if (!players[indexPlayer].statusKeys.up && !players[indexPlayer].statusKeys.down) {
                players[indexPlayer].coefSpeedY *= -1;
            }

            if (players[indexPlayer].speedY > 0) {
                players[indexPlayer].speedY--;
            } else {
                players[indexPlayer].speedY++;
            }

            players[indexPlayer].speedY = players[indexPlayer].speedY * (-1) + players[indexPlayer].coefSpeedY;
            players[indexPlayer].posY = scenes[indexScene].posY + scenes[indexScene].height - players[indexPlayer].height;
        }

        gameObjects.players = players;

        return gameObjects;
    }

    onPlayerBulletCollision(colObject, gameObjects) {
        const { gameSettings: { objects: { scene: { size: sizeScene }, players: { speed, health } } } } = this.config;

        let { bullets, players } = gameObjects;

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
        let { bufEffects, players } = gameObjects;

        const bufEffect = colObject.objectTwo;
        const player = colObject.objectOne;

        const indexBufEffect = bufEffects.indexOf(bufEffect);

        if (indexBufEffect === -1) {
            console.log(`Buf effect is not exists!`);
            return;
        }

        const indexPlayer = players.indexOf(player);

        if (indexPlayer === -1) {
            console.log(`Player is not exists!`);
            return gameObjects;
        }

        const typeBufEffect = bufEffects[indexBufEffect].bufEffect;
        const nickname = players[indexPlayer].nickname;
        const time = bufEffects[indexBufEffect].time * 1000;

        switch (typeBufEffect) {
            case 'medicine':
                players[indexPlayer].health += bufEffects[indexBufEffect].health;
                break;

            case 'boostSpeed':
                const indexBootSpeed = players[indexPlayer].actingBufEffects.indexOf(typeBufEffect);

                if (indexBootSpeed !== -1) {
                    players[indexPlayer].actingBufEffects.splice(indexBootSpeed, 1);
                }

                players[indexPlayer].actingBufEffects.push(
                    {
                        name: typeBufEffect,
                        speed: bufEffects[indexBufEffect].speed,
                    }
                );

                console.log(`Set timeout for bufEffect ${typeBufEffect} at ${bufEffects[indexBufEffect].time} ms`);

                this.startBufEffectTimer(typeBufEffect, nickname, time);

                break;

            case 'boostRate':
                const indexBoostRate = players[indexPlayer].actingBufEffects.indexOf(typeBufEffect);

                if (indexBoostRate !== -1) {
                    players[indexPlayer].actingBufEffects.splice(indexBoostRate, 1);
                }

                players[indexPlayer].actingBufEffects.push(
                    {
                        name: typeBufEffect,
                        rate: bufEffects[indexBufEffect].rate,
                    }
                );

                console.log(`Set timeout for bufEffect ${typeBufEffect} at ${bufEffects[indexBufEffect].time} ms`);

                this.startBufEffectTimer(typeBufEffect, nickname, time);

                break;

            case 'doubleDamage':
                const indexDoubleDamage = players[indexPlayer].actingBufEffects.indexOf(typeBufEffect);

                if (indexDoubleDamage !== -1) {
                    players[indexPlayer].actingBufEffects.splice(indexDoubleDamage, 1);
                }

                players[indexPlayer].actingBufEffects.push({ name: typeBufEffect });

                console.log(`Set timeout for bufEffect ${typeBufEffect} at ${bufEffects[indexBufEffect].time} ms`);

                this.startBufEffectTimer(typeBufEffect, nickname, time);

                break;

            case 'cartridgeBlaster':
                players[indexPlayer].weaponNumberBullet['blaster'] = bufEffects[indexBufEffect].numberBullets;
                break;

            case 'cartridgePlazma':
                players[indexPlayer].weaponNumberBullet['plazma'] = bufEffects[indexBufEffect].numberBullets;
                break;

            case 'cartridgeMiniGun':
                players[indexPlayer].weaponNumberBullet['miniGun'] = bufEffects[indexBufEffect].numberBullets;
                break;

            case 'cartridgeShotGun':
                players[indexPlayer].weaponNumberBullet['shotGun'] = bufEffects[indexBufEffect].numberBullets;
                break;

            default:
                break;
        }

        bufEffects.splice(indexBufEffect, 1);
        gameObjects.bufEffects = bufEffects;
        gameObjects.players = players;

        return gameObjects;
    }

    initTimer(nickname) {
        this.timers[nickname] = [];
    }

    startBufEffectTimer(typeBufEffect, nickname, time) {
        try {
            if (!this.timers.hasOwnProperty(nickname)) {
                this.timers[nickname] = [];
            }

            for (const timerObj of this.timers[nickname]) {
                if (timerObj.bufEffect !== typeBufEffect) {
                    continue;
                }

                clearTimeout(timerObj.timer);

                const indexTimer = this.timers[nickname].indexOf(timerObj);

                this.timers[nickname].splice(indexTimer, 1);

                break;
            }

            const timer = setTimeout(() => { this.core.onTimeoutBufEffects(nickname, typeBufEffect) }, time);
            this.timers[nickname].push({ typeBufEffect, timer });
        } catch (err) {
            console.log(err);
        }
    }

    stopAllBufEffectsTimers(nickname) {
        for (const timerObj of this.timers[nickname]) {
            clearTimeout(timerObj.timer);
        }

        delete this.timers[nickname];
    }

    speedControl(player) {
        const { maxSpeedX, maxSpeedY, speed, actingBufEffects } = player;

        let bufSpeed = 0;

        for (const bufEffect of actingBufEffects) {
            if (bufEffect.name === 'boostSpeed') {
                bufSpeed = bufEffect.speed;
            }
        }

        if (maxSpeedX > 0 && player.speedX < speed + bufSpeed) {
            player.speedX++;
        }

        if (maxSpeedX < 0 && player.speedX > - (speed + bufSpeed)) {
            player.speedX--;
        }

        if (maxSpeedY > 0 && player.speedY < speed + bufSpeed) {
            player.speedY++;
        }

        if (maxSpeedY < 0 && player.speedY > - (speed + bufSpeed)) {
            player.speedY--;
        }

        if (!maxSpeedX && player.speedX > - maxSpeedX) {
            player.speedX--;
        }

        if (!maxSpeedX && player.speedX < maxSpeedX) {
            player.speedX++;
        }

        if (!maxSpeedY && player.speedY > - maxSpeedY) {
            player.speedY--;
        }

        if (!maxSpeedY && player.speedY < maxSpeedY) {
            player.speedY++;
        }

        return player;
    }
}
