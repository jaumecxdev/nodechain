const mongoose = require("mongoose");

module.exports = async function (globalConfig, projectConfig) {
    console.log(globalConfig.testPathPattern);
    console.log(projectConfig.cache);

    // GLOBAL
    //global.app = {}
    //global.app.port = process.argv[3] || process.env.PORT || '50000';
    
    // BLOCKCHAIN
    //require('../starts/blockchain');

    // CLOSE gRPC
    globalThis.__SERVER__.tryShutdown((err) => {
      if (err) {
          console.log('err');
      }
    });

    // CLOSE MONGO
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await globalThis.__MONGOD__.stop();
};
