const fs = require('fs');
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader")

var server = new grpc.Server();

// GRPC BLOCKCHAIN SERVICE
const blockchainProto = grpc.loadPackageDefinition(
    protoLoader.loadSync("./grpc/protos/blockchain.proto", {
        keepCase: true,
        longs: String,
        enums: String,
        arrays: true,
        defaults: true,
        oneofs: true
    })
).blockchainProto;

const { checkBlockchain, getLastBlock } = require('../grpc/services/Blockchain')
server.addService(blockchainProto.Blockchain.service, { 
    "check": checkBlockchain,
    "getLastBlock": getLastBlock
});

// GRPC ACCOUNT SERVICE
const accountProto = grpc.loadPackageDefinition(
    protoLoader.loadSync("./grpc/protos/accounts.proto", {
        keepCase: true,
        longs: String,
        enums: String,
        arrays: true,
        defaults: true,
        oneofs: true
    })
).accountProto;

const { createAccount, readAccount, joinAccount } = require('../grpc/services/Account')
server.addService(accountProto.Account.service, { 
    "create": createAccount, 
    "read": readAccount,
    "join": joinAccount
});

// GRPC COIN SERVICE
const coinProto = grpc.loadPackageDefinition(
    protoLoader.loadSync("./grpc/protos/coins.proto", {
        keepCase: true,
        longs: String,
        enums: String,
        arrays: true,
        defaults: true,
        oneofs: true
    })
).coinProto;

const { createCoin, mineCoin, transferCoin, transferCoinTos, readCoin } = require('../grpc/services/Coin')
server.addService(coinProto.Coin.service, { 
    "create": createCoin,
    "mine": mineCoin,
    "transfer": transferCoin,
    "transferTos": transferCoinTos,     // 1 From, multi To's
    "read": readCoin 
});


// gRPC SERVER START

const credentials = grpc.ServerCredentials.createSsl(
    fs.readFileSync('./certs/ca.crt'), [{
        private_key: fs.readFileSync('./certs/server.key'),
        cert_chain: fs.readFileSync('./certs/server.crt')
    }], 
    true
);

server.bindAsync('127.0.0.1:' + global.app.port, credentials, (error, port) => {
    //!err ? server.start() : logger.error(err);
    server.start();
    console.log(`gRPC listening on port ${port}`);
    global.app.secureTransfer = {};
});

module.exports = {
    server
}