module.exports = class GameEngine{
    constructor(objects, workJson) {
        this.objects = objects;
        this.workJson = workJson;
    }

    onNextFrame() {
        const {objects, workJson} = this;

        const players = objects.getGameObject('players');
        const bullets = objects.getGameObject('bullets');
        const walls = objects.getGameObject('walls');
        const bufEffects = objects.getGameObject('bufEffects');

        workJson.toObjectsJson({players, bullets, walls, bufEffects});
    }
}