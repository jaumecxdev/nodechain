const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader")
const packageDef = protoLoader.loadSync("./grpc/protos/accounts.proto", {});
const grpcObject = grpc.loadPackageDefinition(packageDef);
const accountPackage = grpcObject.accountPackage;

const text = process.argv[2];

async function main() {
    var client =  new accountPackage.Account("localhost:50000", grpc.credentials.createInsecure())
    
    client.read({ "_id": 1 }, (err, response) => {
        console.log("Account has been read " + JSON.stringify(response))
    })

    await client.create({
        "_id": 3,
        "type": 2,
        "address": "title 3",
        "public": "Herod 3",
        "private": "Content 3"
    }, (err, response) => {
        console.log("Account has been created " + JSON.stringify(response))
    })

    client.read({ "_id": 2 }, (err, response) => {
        console.log("Account has been read " + JSON.stringify(response))
    })
}

main();