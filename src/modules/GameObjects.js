module.exports = class GameObjects {
    constructor() {
        this.players = [];
        this.bullets = [];
        this.walls = [];
        this.bufEffects = [];
    }

    setGameObject(name, array) {
        switch (name) {
            case 'players':
                this.players = array;
                break;

            case 'bullets':
                this.bullets = array;
                break;

            case 'walls':
                this.walls = array;
                break;

            case 'bufEffects':
                this.bufEffects = array;
                break;

            default:
                console.log(`Object ${name} is not found!`);

                return;
        }
    }

    getGameObject(name) {
        switch (name) {
            case 'players':
                return this.players;

            case 'bullets':
                return this.bullets;

            case 'walls':
                return this.walls;

            case 'bufEffects':
                return this.bufEffects;

            default:
                console.log(`Object ${name} is not found!`);
                break;
        }

        return {};
    }
};
