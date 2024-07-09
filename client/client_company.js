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

    var userAccount = await World.findOne({ datatype: 'account', ['info.type']: 'users' }).exec();

    var transaction = LCLTCrypto.signTransaction(userAccount.private, {
        sender: userAccount.address,
        payload: JSON.stringify({ type: 'companies', name: 'Company2' }),
    });

    await grpcAccount.create(transaction, async (err, response) => {
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
            console.log("Response 1: " + JSON.stringify(response));
            if (response.code == grpc.status.OK) {
                const payload = JSON.parse(response.payload);
                console.log(response.message);
                console.log("Company: " + JSON.stringify(payload.account));
                
                // JOIN COMPANY TO ORG
                const companyAddress = payload.account.address;
                var orgAccount = await World.findOne({ datatype: 'account', ['info.type']: 'orgs' }).exec();
    
                var transaction = LCLTCrypto.signTransaction(userAccount.private, {
                    sender: userAccount.address,
                    // Join Company to Org
                    // from, to, group: (orgs, companies, users), as: {"", owner, admin, payer, cashier}
                    payload: JSON.stringify({
                        from: companyAddress, 
                        to: orgAccount.address,
                        as: ''  // join without any permissions
                    }),
                });
    
                await grpcAccount.join(transaction, async (err, response) => {
                    if (err) {
                        console.log("Code: " + err.code);           // 5, 14 -> SERVER ERROR
                        console.log("Details: " + err.details);     // 'Payload & Sender are required'
                        console.log("Message: " + err.message);     // "5 NOT_FOUND: Payload & Sender are required"
                        // console.log("Stack: " + err.stack);         // All line errors
                        // err.metadata.internalRepr                ???
                        // err.metadata.options                     ???
                        // code, details
                        console.log("Error 1: " + JSON.stringify(err));
                    } else {
                        console.log("Response 2: " + JSON.stringify(response));
                        if (response.code == grpc.status.OK) {
                            const payload = JSON.parse(response.payload);
                            console.log(response.message);
                            console.log("Join: " + JSON.stringify(payload.account));
                        }
                    }
                });
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

