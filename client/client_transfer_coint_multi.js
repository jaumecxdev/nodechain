const grpc = require("@grpc/grpc-js");
const { grpcBlockchain, grpcAccount, grpcCoin } = require("../test/gRPCClient")
const LCLTCrypto = require('../grpc/LCLTCrypto');
const { World } = require('../mongo/models/World');

async function main() {

    // npm run start -- 1 3001
    global.app = {}
    global.app.port = normalizePort(process.argv[3] || process.env.PORT || '50000');
    global.app.nodeId = process.argv[2] || 0;
    console.log('nodeId: '+global.app.nodeId + ' Port: ' + global.app.port);

    // MONGODB
    require('../starts/mongo');

    var coin = await World.findOne({ datatype: 'coin', ['info.code']: 'PDA' }).exec();
    var orgAccount = await World.findOne({ datatype: 'account', ['info.type']: 'orgs', ['info.coin_address']: coin.address }).exec();
    var userAccount = await World.findOne({ datatype: 'account', ['info.type']: 'users', ['info.permits.orgs.'+orgAccount.address]: 'owner' }).exec();
    var companyAccount = await World.findOne({ datatype: 'account', ['info.type']: 'companies' }).exec();
    
    /* var transaction = LCLTCrypto.signTransaction(userAccount.private, {
        sender: userAccount.address,
        payload: JSON.stringify({
            from: orgAccount.address, 
            to: userAccount.address,
            coin_address: coin.address,
            count: 100
        }),
    }); */

    // Org -> User
    for (var i = 0; i < 30; i++) {     
        var transaction = LCLTCrypto.signTransaction(userAccount.private, {
            sender: userAccount.address,
            payload: JSON.stringify({
                from: userAccount.address, 
                to: orgAccount.address,
                coin_address: coin.address,
                count: 100
            }),
        });
        
        grpcCoin.transfer(transaction, async (err, response) => {
            if (err) {
                console.log("Error Code: " + err.code);           // 5, 14 -> SERVER ERROR
                console.log("Error Details: " + err.details);     // 'Payload & Sender are required'
                console.log("Error Message: " + err.message);     // "5 NOT_FOUND: Payload & Sender are required"
                //console.log("Error Stack: " + err.stack);         // All line errors
                // err.metadata.internalRepr                ???
                // err.metadata.options                     ???
                // code, details
                console.log("Error 1: " + JSON.stringify(err));
            } else {
                console.log("Response: " + JSON.stringify(response));
                if (response && response.code == grpc.status.OK) {
                    const payload = JSON.parse(response.payload);
                    //console.log(response.message);
                    console.log("Hash: " + JSON.stringify(payload.hash));
                    //console.log("Coin: " + JSON.stringify(payload.coin));
                    console.log("From: " + JSON.stringify(payload.from.balance));
                    console.log("To: " + JSON.stringify(payload.to.balance));
                }
            }
        });
    }

    // Org -> Company
    /* for (var i = 0; i < 30; i++) {     
        var transaction = LCLTCrypto.signTransaction(userAccount.private, {
            sender: userAccount.address,
            payload: JSON.stringify({
                from: companyAccount.address, 
                to: orgAccount.address,
                coin_address: coin.address,
                count: 100,
                count_trans: i
            }),
        });
        
        grpcCoin.transfer(transaction, async (err, response) => {
            if (err) {
                console.log("Error Code: " + err.code);           // 5, 14 -> SERVER ERROR
                console.log("Error Details: " + err.details);     // 'Payload & Sender are required'
                console.log("Error Message: " + err.message);     // "5 NOT_FOUND: Payload & Sender are required"
                //console.log("Error Stack: " + err.stack);         // All line errors
                // err.metadata.internalRepr                ???
                // err.metadata.options                     ???
                // code, details
                console.log("Error 1: " + JSON.stringify(err));
            } else {
                console.log("Response: " + JSON.stringify(response));
                if (response && response.code == grpc.status.OK) {
                    const payload = JSON.parse(response.payload);
                    //console.log(response.message);
                    console.log("Hash: " + JSON.stringify(payload.hash));
                    //console.log("Coin: " + JSON.stringify(payload.coin));
                    console.log("From: " + JSON.stringify(payload.from.balance));
                    console.log("To: " + JSON.stringify(payload.to.balance));
                }
            }
        });
    } */
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

