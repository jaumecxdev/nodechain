const grpc = require("@grpc/grpc-js");
const Model = require('../../mongo/models/node');
const { checkgRPCRequest } = require('../Utils');


exports.checkBlockchain = async (call, callback) => {

    try {
        const sender = await checkgRPCRequest(call.request)
        if (!sender) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "Malformed request" });
        }

        // CHECK SENDER PERMISSIONS !!!

        const blockchainCheck = await global.app.blockchain.check();
        if (blockchainCheck == null) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "No blockchainCheck found" });
        }

        callback(null, {
            code: grpc.status.OK,
            message: "Blockchain checked",
            payload: JSON.stringify({
                sender: sender.address,
                check: blockchainCheck
            }),
        });

    } catch (error) {
        callback(error);
    }
}

exports.getLastBlock = async (call, callback) => {

    try {
        const sender = await checkgRPCRequest(call.request)
        if (!sender) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "Malformed request" });
        }

        // CHECK SENDER PERMISSIONS !!!

        const block = await global.app.blockchain.getLastBlock();
        if (block == null) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "No block found" });
        }

        callback(null, {
            code: grpc.status.OK,
            message: "Blockchain checked",
            payload: JSON.stringify({
                sender: sender.address,
                block: block
            }),
        });

    } catch (error) {
        throw error;
    }
}




exports.checkNodes = async (appNodeId) => {

    first_node = process.env.FIRST_NODE;
    const nodes = await Model.Node.find().exec();

    // Is the first time I start?
    if (nodes == null) {
        const nodes = require('../config/nodes.json');
        var count = 0;
        var node;
        nodes.forEach(async nodeAddress => {    // CHANGE FOR: for (const nodeAddress of nodes) {

          node = new Model.Node({
                address: nodeAddress,
                weight: count,
                online: true,
                info: {}
          });

          await node.save().then(data => {
                console.log(data);
            }).catch(err => {
                console.log(err);
            });
        });

        if (appNodeId != 0) {
            // Inform node 0 the new node
            // Get others nodes info from node 0
        }
        else {
            // I'm the first new node of the blockchain!!!!
            // Check BLOCKS, if empty create GENESIS node
        }
    
    }
    // Node are restarted
    else {
        nodes.forEach(async node => {       // CHANGE FOR: for (const node of nodes) {

            // Inform all nodes that I'm online
            // Get new nodes, blocks and addresses
        });
    }

}
