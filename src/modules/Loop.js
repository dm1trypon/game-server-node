const Config = require('./Config');

module.exports = class Loop {
    constructor(core) {
        this.core = core;
        this.startedTimers = [];

        this.setTimers();
    }

    setTimers() {
        const config = Config.getInstance().getConfig();
        const {gameEngine: {fps}, gameSettings: {objects: {bufEffects}}} = config;

        process.nextTick(() => this.start(fps, 'fps', 'fps'));

        this.startedTimers.push({name: 'fps', status: false});

        console.log(`Started fps timer: ${fps} ms`);

        for (const bufEffect of Object.keys(bufEffects)) {
            const {interval} = bufEffects[bufEffect];

            process.nextTick(() => this.start(interval, 'bufEffects', bufEffect));

            this.startedTimers.push({name: bufEffect, status: false});

            console.log(`Started ${bufEffect} timer: ${interval} ms`);
        }
    }

    start(interval, type, bufEffect) {
        for (let timer of this.startedTimers) {
            if (timer.name !== bufEffect) {
                continue;
            }

            if (!timer.status) {
                timer.status = true;

                break;
            }

            new Promise(() => {
                this.core.onLoopEvent(type, bufEffect);
            })
        }

        new Promise(() => {
            setTimeout(() => process.nextTick(() => this.start(interval, type, bufEffect)), interval);
        });
        
    }
}

// ******************* LOOP OLD ALTERNATIVE VERSION *******************

// const Config = require('./Config');

// module.exports = class Loop {
//     constructor(core) {
//         this.core = core;
//         this.timers = {};

//         this.setTimers();
//         this.start();
//     }

//     setTimers() {
//         const config = Config.getInstance().getConfig();
//         const {gameEngine: {fps}, gameSettings: {objects: {bufEffects}}} = config;

//         this.timers['fps'] = {current: 0, stop: fps, type: 'fps'};

//         for (const bufEffect of Object.keys(bufEffects)) {
//             const {interval} = bufEffects[bufEffect];

//             this.timers[bufEffect] = {current: 0, stop: interval, type: 'bufEffects'};
//         }

//         console.log(`Set timers objects: ${this.timers}`);
//     }

//     start() {
//         const {timers} = this;
//         console.log(timers);

//         setInterval(() => {
//             for (const bufEffect of Object.keys(timers)) {
//                 if (timers[bufEffect].current === timers[bufEffect].stop) {
//                     this.core.onLoopEvent(timers[bufEffect].type, bufEffect);
//                     timers[bufEffect].current = 0;
//                 }

//                 timers[bufEffect].current ++;
//             }
//         }, 1)
//     }
// }
