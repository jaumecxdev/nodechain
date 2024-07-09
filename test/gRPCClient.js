const fs = require('fs')
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader")

const blockchainProto = grpc.loadPackageDefinition(
    protoLoader.loadSync("./grpc/protos/blockchain.proto", {})
).blockchainProto;

const accountProto = grpc.loadPackageDefinition(
    protoLoader.loadSync("./grpc/protos/accounts.proto", {})
).accountProto;

const coinProto = grpc.loadPackageDefinition(
    protoLoader.loadSync("./grpc/protos/coins.proto", {})
).coinProto;

// gRPC Client credentials
const credentials = grpc.credentials.createSsl(
    fs.readFileSync('./certs/ca.crt'),         // @param rootCerts — The root certificate data.
    fs.readFileSync('./certs/client.key'),     // @param privateKey — The client certificate private key, if available.
    fs.readFileSync('./certs/client.crt')      // @param certChain — The client certificate key chain, if available.
);

// CREATE NEW USER ACCOUNT
var grpcBlockchain =  new blockchainProto.Blockchain("localhost:50000", credentials);
var grpcAccount =  new accountProto.Account("localhost:50000", credentials);
var grpcCoin =  new coinProto.Coin("localhost:50000", credentials);

module.exports = {
    grpcBlockchain, grpcAccount, grpcCoin
}