const Server = require('./src/modules/Server');
const Config = require('./src/modules/Config');

const config = Config.getInstance();
config.read('./src/config.json');

const server = new Server(config.getConfig());
server.start();
