const { Blockchain } = require('../contracts/Blockchain');

global.app.blockchain = new Blockchain();
global.app.blockchainLock = false;
console.log(`Blockchain started`);
