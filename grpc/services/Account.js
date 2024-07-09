const grpc = require("@grpc/grpc-js");
const LCLTCrypto = require('../LCLTCrypto');
const { World } = require('../../mongo/models/World');
const { CodeError, secureJsonParse, checkgRPCRequest } = require('../Utils');


exports.readAccount = async (call, callback) => {

    try {
        const sender = await checkgRPCRequest(call.request)
        if (!sender) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "Malformed request" });
        }

        const payload = secureJsonParse(call.request.payload);

        // SENDER PERMISSIONS ???

        const account = await World.findOne({ datatype: 'account', address: payload.address }).exec();
        if (account == null) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "No account Found" });
        }

        callback(null, {
            code: grpc.status.OK,
            message: 'Account readed',
            payload: JSON.stringify({
                sender: sender.address,
                account: {
                    address: account.address,
                    public: account.public,
                    datatype: account.datatype,
                    info: account.info
                }
            }),
        });

    } catch (error) {
        callback(error);
    }
}


exports.createAccount = async (call, callback) => {

    try {
        // Type: 'users'
        // Not required decrypt payload
        if (call.request.sender == "") {

            const sender = "";
            const type_users = 'users';

            const payload = secureJsonParse(call.request.payload);
            const { hashKey, publicKey, privateKey } = LCLTCrypto.generate3Keys();
            const accountModel = new World({
                address: hashKey,
                public: publicKey,
                private: privateKey,        // REMOVE IN PROD
                datatype: 'account',
                info: payload
            });

            accountModel.info.type = type_users;

            const account = await accountModel.save();
            if (account == null) {
                throw new CodeError({ code: grpc.status.NOT_FOUND, message: "Error creating new account" });
            }

            const block = {
                message: "New account",
                sender: null,
                account: {
                    address: account.address,
                    public: account.public,
                    datatype: account.datatype,
                    info: account.info
                }
            }

            // Add Block to Blockchain
            const hash = await global.app.blockchain.addBlock(block);
            block.hash = hash;
            block.account.private = privateKey;

            callback(null, {
                code: grpc.status.OK,
                message: 'New account',
                payload: JSON.stringify(block),
            });
        }
        // Type: 'orgs', 'companies'
        else {
            const sender = await checkgRPCRequest(call.request)
            if (!sender) {
                throw new CodeError({ code: grpc.status.NOT_FOUND, message: "Malformed request" });
            }

            // type, name, 
            const payload = secureJsonParse(call.request.payload);
            if (!['orgs', 'companies'].includes(payload.type)) {
                throw new CodeError({ code: grpc.status.NOT_FOUND, message: "No type found" });
            }

            const { hashKey, publicKey, privateKey } = LCLTCrypto.generate3Keys();
            const accountModel = new World({
                address: hashKey,
                public: publicKey,
                private: privateKey,        // REMOVE IN PROD
                datatype: 'account',
                info: payload
            });

            accountModel.info.type = payload.type;

            // Create new account Type: 'orgs' || 'companies'
            const account = await accountModel.save();
            if (account == null) {
                throw new CodeError({ code: grpc.status.NOT_FOUND, message: "Error creating new account" });
            }

            // Update Org||Company Account: Permits
            const role_owner = 'owner';
            await account.lcltInsertInfoPermit('users', call.request.sender, role_owner);
            // Update Sender User Account: Permits (orgs || companies)
            await sender.lcltInsertInfoPermit(payload.type, account.address, role_owner);

            const block = {
                message: "New account",
                sender: sender.address,
                account: {
                    address: account.address,
                    public: account.public,
                    datatype: account.datatype,
                    info: account.info
                }
            }

            // Add Block to Blockchain
            const hash = await global.app.blockchain.addBlock(block);
            block.hash = hash;
            block.account.private = privateKey;

            callback(null, {
                code: grpc.status.OK,
                message: 'New account',
                payload: JSON.stringify(block),
            });
        }

    } catch (error) {
        callback(error);
    }
}


exports.joinAccount = async (call, callback) => {

    try {
        const sender = await checkgRPCRequest(call.request)
        if (!sender) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "Malformed request" });
        }

        const payload = secureJsonParse(call.request.payload);

        // from, to, as: {'', owner, admin, payer, cashier}
        if (!['', 'owner', 'admin', 'payer', 'cashier'].includes(payload.as)) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "No as found" });
        }

        const from = await World.findOne({ datatype: 'account', address: payload.from }).exec();
        if (from == null) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "No from account Found" });
        }

        const to = await World.findOne({ datatype: 'account', address: payload.to }).exec();
        if (to == null) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "No to account Found" });
        }

        // AVAILABLE JOIN PERMITS
        // from, to, as: {'', owner, admin, payer, cashier}
        // from:users -> to:users  -> NOT AVAILABLE: user don't have permissions of other users
        // from:users -> to:orgs  -> as:'', 'owner', 'admin', 'payer', 'cashier'
        // from:users -> to:companies  -> as:''???, 'owner', 'admin', 'payer', 'cashier'
        // from:companies -> to:users  -> NOT AVAILABLE: companies don't have permissions of users
        // from:companies -> to:orgs  -> as:''
        // from:companies -> to:companies  -> NOT AVAILABLE: companies don't have permissions of other companies
        // from:orgs -> to:users  -> NOT AVAILABLE: orgs don't have permissions of users
        // from:orgs -> to:orgs  -> NOT AVAILABLE: orgs don't have permissions of other orgs
        // from:orgs -> to:companies  -> NOT AVAILABLE: orgs don't have permissions of companies

        // orgs don't have permissions TO users, companies or other orgs
        if (!['users', 'companies'].includes(from.info.type)) {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "From type not available" });
        }

        // Companies only can be joined to orgs
        if (from.info.type == 'companies' && to.info.type != 'orgs') {
            throw new CodeError({ code: grpc.status.NOT_FOUND, message: "Companies only can be joined to orgs" });
        }

        // Users, Companies or Orgs don't have permissions of any user
        if (to.info.type == 'users') {
            throw new CodeError({ code: grpc.status.PERMISSION_DENIED, message: "Anybody have permissions of any user" });
        }

        // Check if sender has permissions for FROM Joins: 'owner' || 'admin'
        if (call.request.sender != payload.from) {
            // user don't have permissions of other users
            if (from.info.type == 'users') {
                throw new CodeError({ code: grpc.status.PERMISSION_DENIED, message: "Not enough permissions" });
            }
            else {
                // from.info.type == 'companies' && to.info.type == 'orgs'
                // All permissions: owner, admin, payer, cashier
                if (!sender.lclHasInfoPermitRoles(from.info.type, from.address, ['owner', 'admin'])) {
                    throw new CodeError({ code: grpc.status.PERMISSION_DENIED, message: "Not enough permissions" });
                }
            }
        }

        // to.info.type == 'orgs' || to.info.type == 'companies'    
        // UPDATE FROM PERMITS
        // All permissions: '', owner, admin, payer, cashier
        await from.lcltInsertInfoPermit(to.info.type, to.address, payload.as);
        // UPDATE TO PERMITS
        // All permissions: '', owner, admin, payer, cashier
        await to.lcltInsertInfoPermit(from.info.type, from.address, payload.as);

        // Add Block to Blockchain
        const hash = await global.app.blockchain.addBlock({
            message: "Join account",
            sender: sender.address,
            from: payload.from,
            to: payload.to,
            as: payload.as
        });

        callback(null, {
            code: grpc.status.OK,
            message: "Join account",
            payload: JSON.stringify({
                hash: hash,
                sender: sender.address,
                from: payload.from,
                to: payload.to,
                as: payload.as
            }),
        });

    } catch (error) {
        callback(error);
    }
}