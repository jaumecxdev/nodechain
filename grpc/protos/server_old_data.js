// https://grpc.io/docs/languages/node/quickstart
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader")
const packageDef = protoLoader.loadSync("accounts.proto", {});
const grpcObject = grpc.loadPackageDefinition(packageDef);
const accountProto = grpcObject.accountProto;

let accounts = [
  { _id: 1, type: 2, address: 'Note 1', public: "Munroe", private: 'Content 1'},
  { _id: 2, type: 2, address: 'Note 2', public: "Maxwell", private: 'Content 2'}
]

function create (call, callback) {
    const account = call.request;
    account.id = accounts.length + 1;
    accounts.push(account);
    callback(null, { accounts });
}

function read (call, callback) {
    const account = accounts.find(n => n._id == call.request._id);

    if (account) {
        callback(null, account);
        // callback(null, {message: 'Hello again, ' + call.request.name});
    } else {
        callback({
            code: grpc.status.NOT_FOUND,
            details: "Not found"
        });
    }
}

function main() {
    var server = new grpc.Server();
    server.addService(accountProto.Account.service, { 
        "create": create, 
        "read": read 
    });
    server.bindAsync('127.0.0.1:50000', grpc.ServerCredentials.createInsecure(), (error, port) => {
        server.start();
        console.log(`listening on port ${port}`);
    });
}

main();