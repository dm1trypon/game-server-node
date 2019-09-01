const fs = require('fs');

module.exports = class Config {
    constructor() {
        this.config = {};
    }

    static getInstance(...args) {
        if (!this.instance) {
            this.instance = new this(...args);
        }

        return this.instance;
    }

    read(pathToConfig) {
        if (!fs.existsSync(pathToConfig)) {
            console.log(`Config is not exist on path: ${pathToConfig}`);
            process.exit(-1);
        }

        const configData = fs.readFileSync(pathToConfig);
        
        try {
            this.config = JSON.parse(configData);
        } catch (err) {
            console.log(err);
            process.exit(-1);
        }
        
        console.log(this.config);
    }

    getConfig() {
        return this.config;
    }
}