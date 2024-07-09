const grpc = require("@grpc/grpc-js");
const LCLTCrypto = require('../LCLTCrypto');
const { World } = require('../../mongo/models/World');
const { CodeError, secureJsonParse, checkgRPCRequest, 
    acquireTransferLock, releaseTransferLock, isTransferLock, 
    acquireTransferAllLock, isTransferAnyLock } = require('../Utils');


exports.readCoin = async (call, callback) => {

    try {
        const sender = await checkgRPCRequest(call.request)
        if (!sender) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "Malformed request" });
        }

        const payload = secureJsonParse(call.request.payload);

        const coin = await World.findOne({ datatype: 'coin', address: payload.address }).exec();
        if (coin == null) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "No coin Found" });
        }

        callback(null, {
            code: grpc.status.OK,
            message: 'Coin readed',
            payload: JSON.stringify({
                sender: sender.address,
                coin: coin.address
            }),
        });

    } catch (error) {
        callback(error);
    }
}


exports.createCoin = async (call, callback) => {

    try {
        const sender = await checkgRPCRequest(call.request)
        if (!sender) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "Malformed request" });
        }

        const payload = secureJsonParse(call.request.payload);
        /* if (payload.code == null) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "No code found" });
        } */

        /* payload.name = payload.name ?? payload.code;
        payload.equal = payload.equal ?? 'euro';
        if (!['euro', 'dollar'].includes(payload.equal)) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "No equal found" });
        } */

        // ORG IS NEEDED !!!!

        // Check Org
        const org = await World.findOne({ datatype: 'account', ["info.type"]: "orgs", address: payload.org_address }).exec();
        if (org == null) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "No org found" });
        }

        // Check that Org don't have any other coin
        if (org.coin_address != null) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "Org already has coin" });
        }

        // Check if sender has permissions for Create Coin for Org
        // already possible check by FROM users
        // '', owner, admin, payer, cashier
        if (!sender.lclHasInfoPermitRoles(org.info.type, org.address, ['owner', 'admin'])) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "Not enough permissions" });
        }

        // Create new coin CODE
        const { hashKey, publicKey, privateKey } = LCLTCrypto.generate3Keys();
        const coinModel = new World({
            address: hashKey,
            public: publicKey,
            datatype: 'coin',
            info: {
                org_address: payload.org_address
            }
        });

        /* info: {
            code: payload.code,
            name: payload.name,
            equal: payload.equal,
            org_address: payload.org_address
        } */

        const coin = await coinModel.save();
        if (coin == null) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "Error creating new coin" });
        }

        // Update||change Org Coin address
        await org.lcltSetInfo('coin_address', coin.address);

        const block = {
            message: "Create coin",
            sender: sender.address,
            org: org.address,
            coin: coin.address
        }

        // Add Block to Blockchain
        const hash = await global.app.blockchain.addBlock(block);
        block.hash = hash;
        block.coin.private = privateKey;

        callback(null, {
            code: grpc.status.OK,
            message: 'Coin created',
            payload: JSON.stringify(block)
        });

    } catch (error) {
        callback(error);
    }
}


const mineSecureCoin = async (call, callback, payload) => {
    try {
        const sender = await checkgRPCRequest(call.request)
        if (sender == null) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "Malformed request" });
        }

        // Check Count balance > 0
        payload.count = Number(payload.count);
        if (isNaN(payload.count) || payload.count <= 0) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "No count found" });
        }

        // Check Coin exists
        const coin = await World.findOne({ datatype: 'coin', address: payload.coin_address }).exec();
        if (coin == null) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "No coin found" });
        }

        // Check ORG exists
        var org = await World.findOne({ datatype: 'account', address: payload.org_address }).exec();
        if (org == null) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "No org found" });
        }

        // Check Org own this coin
        if (org.address != coin.info.org_address || org.info.coin_address != coin.address) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "No org own coin found" });
        }

        // Check if sender has permissions for Transfer
        // already possible check by FROM users
        // '', owner, admin, payer, cashier
        if (!sender.lclHasInfoPermitRoles(org.info.type, org.address, ['owner', 'admin'])) {
            throw new CodeError({ code: grpc.status.PERMISSION_DENIED, message: "Not enough permissions" });
        }

        // Add Count to Org balances
        await org.lcltAddInfoBalance(payload.coin_address, payload.count);

        const block = {
            message: "Mine coin",
            sender: sender.address,
            coin: coin.address,
            org: org.address,
            count: payload.count
        }

        // Add Block to Blockchain
        const hash = await global.app.blockchain.addBlock(block);
        block.hash = hash;

        releaseTransferLock(payload.org_address);

        callback(null, {
            code: grpc.status.OK,
            message: "Mine coin",
            payload: JSON.stringify(block)
        });
        
    } catch (error) {
        releaseTransferLock(payload.org_address);

        callback(error);
    }
}


exports.mineCoin = async (call, callback) => {
    try {
        const payload = secureJsonParse(call.request.payload);
        if (isTransferLock(payload.org_address)) {
            setTimeout(async () => {
                await this.mineCoin(call, callback);
            }, 1000);
        }
        else {
            acquireTransferLock(payload.org_address);

            return mineSecureCoin(call, callback, payload);
        }

    } catch (error) {
        releaseTransferLock(payload.org_address);

        callback(error);
    }
}


const transferSecureCoinTos = async (call, callback, payload) => {
    try {
        const sender = await checkgRPCRequest(call.request)
        if (sender == null) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "Malformed request" });
        }

        // Check Count balance > 0
        payload.count = Number(payload.count);
        if (isNaN(payload.count) || payload.count <= 0) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "No count found" });
        }

        // Check Coin exists
        const coin = await World.findOne({ datatype: 'coin', address: payload.coin_address }).exec();
        if (coin == null) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "No coin found" });
        }

        // Check FROM exists
        var from = await World.findOne({ datatype: 'account', address: payload.from }).exec();
        if (from == null) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "No from found" });
        }

        // Check TOs exists
        var tos = [];
        for (const to_address of payload.tos) {
            var to = await World.findOne({ datatype: 'account', address: to_address }).exec();
            if (to == null) {
                throw new CodeError({ code: grpc.status.NOT_FOUND, message: "No to found" });
            }

            tos.push(to);
        }

        // Check if sender has permissions for Transfer
        if (call.request.sender != payload.from) {
            // The sender does not have permissions from users other than himself.
            if (from.info.type == 'users') {
                throw new CodeError({ code: grpc.status.PERMISSION_DENIED, message: "Not enough permissions" });
            }
            else {
                // already possible check by FROM users
                // '', owner, admin, payer, cashier
                if (!sender.lclHasInfoPermitRoles(from.info.type, from.address, ['owner', 'admin', 'payer'])) {
                    throw new CodeError({ code: grpc.status.PERMISSION_DENIED, message: "Not enough permissions" });
                }
            }
        }

        // Check FROM balance
        const count_total = payload.tos.length * payload.count;
        if (!from.lcltHasInfoEnoughBalance(payload.coin_address, count_total)) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "Not enough balance" });
        }

        // Subtracts from FROM and adds it to TOs
        var blockPayloads = [];
        from = await from.lcltSubInfoBalance(payload.coin_address, count_total)
        for (const to of tos) {
            await to.lcltAddInfoBalance(payload.coin_address, payload.count);
            blockPayloads.push({
                message: "Transfer coin",
                sender: sender.address,
                coin: coin.address,
                from: from.address,
                to: to.address,
                count: payload.count
            });
        }

        // Add Block to Blockchain
        const hash = await global.app.blockchain.addBlock(blockPayloads);
        //blockPayloads.push({ hash: hash });
        const block = {
            hash: hash,
            blocks: blockPayloads
        }

        releaseTransferLock(payload.from);
        for (const payload_to of payload.tos) {
            releaseTransferLock(payload_to);
        }

        callback(null, {
            code: grpc.status.OK,
            message: 'Transfer balances added',
            payload: JSON.stringify(block),
        });
        
    } catch (error) {
        releaseTransferLock(payload.from);
        for (const payload_to of payload.tos) {
            releaseTransferLock(payload_to);
        }

        callback(error);
    }
}

// 1 From, 1 Count, multi To's
exports.transferCoinTos = async (call, callback) => {
    try {
        const payload = secureJsonParse(call.request.payload);
        if (isTransferLock(payload.from) || isTransferAnyLock(payload.tos)) {
            setTimeout(async () => {
                await this.transferCoinTos(call, callback);
            }, 1000);
        }
        else {
            acquireTransferLock(payload.from);
            acquireTransferAllLock(payload.tos);

            return transferSecureCoinTos(call, callback, payload);
        }

    } catch (error) {
        releaseTransferLock(payload.from);
        for (const payload_to of payload.tos) {
            releaseTransferLock(payload_to);
        }

        callback(error);
    }
}


const transferSecureCoin = async (call, callback, payload) => {
    try {
        const sender = await checkgRPCRequest(call.request)
        if (sender == null) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "Malformed request" });
        }

        // Check Count balance > 0
        payload.count = Number(payload.count);
        if (isNaN(payload.count) || payload.count <= 0) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "No count found" });
        }

        // Check Coin exists
        const coin = await World.findOne({ datatype: 'coin', address: payload.coin_address }).exec();
        if (coin == null) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "No coin found" });
        }

        // Check FROM exists
        var from = await World.findOne({ datatype: 'account', address: payload.from }).exec();
        if (from == null) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "No from found" });
        }

        // Check TO exists
        var to = await World.findOne({ datatype: 'account', address: payload.to }).exec();
        if (to == null) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "No to found" });
        }

        // Check if sender has permissions for Transfer
        if (call.request.sender != payload.from) {
            // The sender does not have permissions from users other than himself.
            if (from.info.type == 'users') {
                throw new CodeError({ code: grpc.status.PERMISSION_DENIED, message: "Not enough permissions" });
            }
            else {
                // already possible check by FROM users
                // '', owner, admin, payer, cashier
                if (!sender.lclHasInfoPermitRoles(from.info.type, from.address, ['owner', 'admin', 'payer'])) {
                    throw new CodeError({ code: grpc.status.PERMISSION_DENIED, message: "Not enough permissions" });
                }
            }
        }

        // Check FROM balance
        if (!from.lcltHasInfoEnoughBalance(payload.coin_address, payload.count)) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "Not enough permissions" });
        }

        // Subtracts from FROM and adds it to TO
        from = await from.lcltSubInfoBalance(payload.coin_address, payload.count)
        to = await to.lcltAddInfoBalance(payload.coin_address, payload.count);

        const block = {
            message: "Transfer coin",
            sender: sender.address,
            coin: coin.address,
            from: from.address,
            to: to.address,
            count: payload.count
        }

        // Add Block to Blockchain
        const hash = await global.app.blockchain.addBlock(block);
        block.hash = hash;

        releaseTransferLock(payload.from);
        releaseTransferLock(payload.to);

        callback(null, {
            code: grpc.status.OK,
            message: 'Transfer balances added',
            payload: JSON.stringify(block),
        });
        
    } catch (error) {
        releaseTransferLock(payload.from);
        releaseTransferLock(payload.to);

        callback(error);
    }
}


exports.transferCoin = async (call, callback) => {
    try {
        const payload = secureJsonParse(call.request.payload);
        if (isTransferLock(payload.from) || isTransferLock(payload.to)) {
            setTimeout(async () => {
                await this.transferCoin(call, callback);
            }, 1000);
        }
        else {
            acquireTransferLock(payload.from);
            acquireTransferLock(payload.to);

            return transferSecureCoin(call, callback, payload);
        }

    } catch (error) {
        releaseTransferLock(payload.from);
        releaseTransferLock(payload.to);

        callback(error);
    }
}
