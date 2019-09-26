const Config = require('./Config');
const { getRandomNumber } = require('./randomizer');

module.exports = class Physics {
    constructor(core) {
        const {defaultWeapon} = core;
        this.core = core;
        this.config = Config.getInstance().getConfig();
        this.defaultWeapon = defaultWeapon;
        this.timers = [];
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
                return this.onPlayersCollision(colObject, gameObjects);

            case 'player_bullet':
                return this.onPlayerBulletCollision(colObject, gameObjects);

            case 'player_wall':
                break;

            case 'player_scene':
                return this.onPlayerSceneCollision(colObject, gameObjects);
                
            default:
                break;
        }
    }

    onPlayersCollision(colObject, gameObjects) {
        let {players} = gameObjects;

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

        playerOne.speedX *= -1;
        playerOne.speedY *= -1;
        playerOne.coefSpeedX *= -1;
        playerOne.coefSpeedY *= -1;

        gameObjects.players = players;

        return gameObjects;
    }

    onPlayerSceneCollision(colObject, gameObjects) {
        let {players, scenes} = gameObjects;

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

        if (players[indexPlayer].posX < scenes[indexScene].posX) {
            if (!player.statusKeys.left && !player.statusKeys.right) {
                player.coefSpeedX *= -1;
            }

            player.speedX = player.speedX * (-1) + player.coefSpeedX;
            players[indexPlayer].posX = scenes[indexScene].posX;
        }

        if (players[indexPlayer].posX + players[indexPlayer].width > scenes[indexScene].posX + scenes[indexScene].width) {
            if (!player.statusKeys.left && !player.statusKeys.right) {
                player.coefSpeedX *= -1;
            }
            
            player.speedX = player.speedX * (-1) + player.coefSpeedX;
            players[indexPlayer].posX = scenes[indexScene].posX + scenes[indexScene].width - players[indexPlayer].width;
        }

        if (players[indexPlayer].posY < scenes[indexScene].posY) {
            if (!player.statusKeys.up && !player.statusKeys.down) {
                player.coefSpeedY *= -1;
            }

            player.speedY = player.speedY * (-1) + player.coefSpeedY;
            players[indexPlayer].posY = scenes[indexScene].posY;
        }

        if (players[indexPlayer].posY + players[indexPlayer].height > scenes[indexScene].posY + scenes[indexScene].height) {
            if (!player.statusKeys.up && !player.statusKeys.down) {
                player.coefSpeedY *= -1;
            }

            player.speedY = player.speedY * (-1) + player.coefSpeedY;
            players[indexPlayer].posY = scenes[indexScene].posY + scenes[indexScene].height - players[indexPlayer].height;
        }

        gameObjects.players = players;

        return gameObjects;
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

                players[indexPlayer].actingBufEffects.push({name: typeBufEffect});

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

            const timer = setTimeout(() => {this.core.onTimeoutBufEffects(nickname, typeBufEffect)}, time);
            this.timers[nickname].push({typeBufEffect, timer});
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

    onStopPlayerSpeed(typeSpeed, player, coefSpeed) {
        if (Math.abs(player[typeSpeed]) - Math.abs(coefSpeed) < 1) {
            player[typeSpeed] = 0;
        } else {
            player[typeSpeed] += coefSpeed;
        }

        return player;
    }

    onStartPlayerSpeed(typeSpeed, player, coefSpeed, speed) {
        if (Math.abs(player[typeSpeed]) + Math.abs(coefSpeed) > speed) { 
            let newSpeed;
            
            if (coefSpeed > 0) {
                newSpeed = 1;
            } else {
                newSpeed = -1;
            }

            player[typeSpeed] = newSpeed * speed;
        } else {
            player[typeSpeed] += coefSpeed;
        }

        return player;
    }
}
