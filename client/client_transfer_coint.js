const fs = require('fs')
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader")
const LCLTCrypto = require('../grpc/LCLTCrypto.js');
const { World } = require('../mongo/models/World.js');

const coinProto = grpc.loadPackageDefinition(
    protoLoader.loadSync("./grpc/protos/coins.proto", {})
).coinProto;

async function main() {

    // npm run start -- 1 3001
    global.app = {}
    global.app.port = normalizePort(process.argv[3] || process.env.PORT || '50000');
    global.app.nodeId = process.argv[2] || 0;
    console.log('nodeId: '+global.app.nodeId + ' Port: ' + global.app.port);

    // MONGODB
    require('../starts/mongo.js');

    // gRPC Client credentials
    const credentials = grpc.credentials.createSsl(
        fs.readFileSync('./certs/ca.crt'),         // @param rootCerts — The root certificate data.
        fs.readFileSync('./certs/client.key'),     // @param privateKey — The client certificate private key, if available.
        fs.readFileSync('./certs/client.crt')      // @param certChain — The client certificate key chain, if available.
    );

    // MINE COINS

    var grpcCoin =  new coinProto.Coin("localhost:50000", credentials);

    var coin = await World.findOne({ datatype: 'coin', ['info.code']: 'PDA' }).exec();
    var orgAccount = await World.findOne({ datatype: 'account', ['info.type']: 'orgs', ['info.coin_address']: coin.address }).exec();
    var userAccount = await World.findOne({ datatype: 'account', ['info.type']: 'users', ['info.permits.orgs.'+orgAccount.address]: 'owner' }).exec();
    
    var transaction = LCLTCrypto.signTransaction(userAccount.private, {
        sender: userAccount.address,
        payload: JSON.stringify({
            from: orgAccount.address, 
            to: userAccount.address,
            coin_address: coin.address,
            count: 100
        }),
    });

    await grpcCoin.transfer(transaction, async (err, response) => {
        if (err) {
            console.log("Code: " + err.code);           // 5, 14 -> SERVER ERROR
            console.log("Details: " + err.details);     // 'Payload & Sender are required'
            console.log("Message: " + err.message);     // "5 NOT_FOUND: Payload & Sender are required"
            //console.log("Stack: " + err.stack);         // All line errors
            // err.metadata.internalRepr                ???
            // err.metadata.options                     ???
            // code, details
            console.log("Error 1: " + JSON.stringify(err));
        } else {
            console.log("Response: " + JSON.stringify(response));
            if (response.code == grpc.status.OK) {
                const payload = JSON.parse(response.payload);
                console.log(response.message);
                console.log("Coin: " + JSON.stringify(payload.coin));
                console.log("From: " + JSON.stringify(payload.from));
                console.log("To: " + JSON.stringify(payload.to));
            }
        }
    })
}


function normalizePort(val) {
    var port = parseInt(val, 10);
  
    if (isNaN(port)) {
      // named pipe
      return val;
    }
  
    if (port >= 0) {
      // port number
      return port;
    }
  
    return false;
}


main();

