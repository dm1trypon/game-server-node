module.exports = class CollisionObjects {
    constructor() {

    }

    getCollisionObjects(gameObjects) {
        const {players, bullets, walls, bufEffects} = gameObjects;

        let collisionObjectsArr = [];

        for (const player of players) {
            const {posX: posOneX, posY: posOneY, width: wOne, height: hOne} = player;

            for (const anotherPlayer of players) {
                if (anotherPlayer === player) {
                    continue;
                }

                const {posX: posTwoX, posY: posTwoY, width: wTwo, height: hTwo} = anotherPlayer;

                if (!this.isCollision({posOneX, posOneY, wOne, hOne}, {posTwoX, posTwoY, wTwo, hTwo})) {
                    continue;
                }

                collisionObjectsArr.push({nameOne: 'player', objectOne: player, nameTwo: 'player', objectTwo: anotherPlayer});
            }

            for (const bullet of bullets) {
                const {posX: posTwoX, posY: posTwoY, width: wTwo, height: hTwo} = bullet;

                if (!this.isCollision({posOneX, posOneY, wOne, hOne}, {posTwoX, posTwoY, wTwo, hTwo})) {
                    continue;
                }

                collisionObjectsArr.push({nameOne: 'player', objectOne: player, nameTwo: 'bullet', objectTwo: bullet});
            }

            for (const wall of walls) {
                const {posX: posTwoX, posY: posTwoY, width: wTwo, height: hTwo} = wall;

                if (!this.isCollision({posOneX, posOneY, wOne, hOne}, {posTwoX, posTwoY, wTwo, hTwo})) {
                    continue;
                }

                collisionObjectsArr.push({nameOne: 'player', objectOne: player, nameTwo: 'wall', objectTwo: wall});
            }

            for (const bufEffect of bufEffects) {
                const {posX: posTwoX, posY: posTwoY, width: wTwo, height: hTwo} = bufEffect;

                if (!this.isCollision({posOneX, posOneY, wOne, hOne}, {posTwoX, posTwoY, wTwo, hTwo})) {
                    continue;
                }

                collisionObjectsArr.push({nameOne: 'player', objectOne: player, nameTwo: 'bufEffect', objectTwo: bufEffect});
            }
        }

        return collisionObjectsArr;
    }

    isCollision(objectOne, objectTwo) {
        let {posOneX, posOneY, wOne, hOne} = objectOne;
        let {posTwoX, posTwoY, wTwo, hTwo} = objectTwo;
        
        posOneX += wOne / 2;
        posOneY += hOne / 2;

        posTwoX += wTwo / 2;
        posTwoY += hTwo / 2;

        const distWidth = posOneX - posTwoX;
        const distHeight = posOneY - posTwoY;
        const distance = Math.abs(Math.sqrt(distWidth * distWidth + distHeight * distHeight));

        if (distance < wOne) {
            return true;
        }

        return false;
    }
}
