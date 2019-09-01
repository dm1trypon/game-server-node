module.exports = class Loop {
    constructor(config) {
        this.timers = {};

        this.setTimers(config);
        this.start();
    }

    setTimers(config) {
        const {gameSettings: {objects: {bufEffects}}} = config;

        for (const bufEffect of Object.keys(bufEffects)) {
            const {interval} = bufEffects[bufEffect];

            this.timers[bufEffect] = {current: 0, stop: interval};
        }

        console.log(`Set timers objects: ${this.timers}`);
    }

    start() {
        const {timers} = this;
        console.log(timers);

        setInterval(() => {
            for (const key of Object.keys(timers)) {
                if (timers[key].current === timers[key].stop) {
                    this.event(key);
                    timers[key].current = 0;
                }

                timers[key].current ++;
            }
        }, 1)
    }

    event(key) {
        console.log(`Event from timer: ${key}`);
    }
}