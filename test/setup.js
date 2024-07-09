const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

module.exports = async function (globalConfig, projectConfig) {
    console.log(globalConfig.testPathPattern);
    console.log(projectConfig.cache);

    // GLOBAL
    global.app = {}
    global.app.port = process.argv[3] || process.env.PORT || '50000';
    
    // STARTS BLOCKCHAIN
    require('../starts/blockchain');

    // STARTS gRPC
    const { server } = require('../starts/grpc');
    // Set reference to gRPC Server in order to close the server during teardown.
    globalThis.__SERVER__ = server;

    // STARTS MONGO
    let mongod;
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    // Set reference to mongod in order to close the server during teardown.
    globalThis.__MONGOD__ = mongod;
    console.log(`Mongo memory server started`);


    /* beforeAll(async () => {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        await mongoose.connect(uri);
    });
      
    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongod.stop();
    });
      
    afterEach(async () => {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
          const collection = collections[key];g,
          await collection.deleteMany();
        }
    }); */
};
