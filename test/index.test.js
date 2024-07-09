const { grpcBlockchain, grpcAccount, grpcCoin } = require("../test/gRPCClient")
const LCLTCrypto = require('../grpc/LCLTCrypto');
const { World } = require('../mongo/models/World');


function sum(a, b) {
    return a + b;
}

describe('Create Accounts', () => {

    // BASIC EXPECT
    it('adds 1 + 2 to equal 3', () => {
        expect(sum(1, 2)).toBe(3);
    });

    var sender = null;
    var org = null;
    var company = null;
    var coin = null;
    var user1 = null;
    var user2 = null;

    // CREATE SENDER USER, ORG & COMPANY & JOIN TO ORG

    it('should create user account', done => {
        function callback(err, res) {
            if (err) { done(err); return; }
            try {
                const payload = JSON.parse(res.payload);
                sender = payload.account;
                expect(res.code).toBe(0);    // grpc.status.OK
                done();
            } catch (err) { done(err); }
        }

        var transaction = { sender: "", payload: "", signature: "" }
        grpcAccount.create(transaction, callback);
    });

    it('should create org account', done => {
        function callback(err, res) {
            if (err) { done(err); return; }
            try {
                const payload = JSON.parse(res.payload);
                org = payload.account;
                expect(res.code).toBe(0);    // grpc.status.OK
                done();
            } catch (err) { done(err); }
        }

        var transaction = LCLTCrypto.signTransaction(sender.private, {
            sender: sender.address,
            payload: JSON.stringify({ type: 'orgs', name: 'Org2' }),
        });
        grpcAccount.create(transaction, callback);
    });

    it('should create company account', done => {
        function callback(err, res) {
            if (err) { done(err); return; }
            try {
                const payload = JSON.parse(res.payload);
                company = payload.account;
                expect(res.code).toBe(0);    // grpc.status.OK
                done();
            } catch (err) { done(err); }
        }

        var transaction = LCLTCrypto.signTransaction(sender.private, {
            sender: sender.address,
            payload: JSON.stringify({ type: 'companies', name: 'Company2' }),
        });
        grpcAccount.create(transaction, callback);
    });

    it('should join company to org', done => {
        function callback(err, res) {
            if (err) { done(err); return; }
            try {
                const payload = JSON.parse(res.payload);
                expect(res.code).toBe(0);    // grpc.status.OK
                done();
            } catch (err) { done(err); }
        }

        var transaction = LCLTCrypto.signTransaction(sender.private, {
            sender: sender.address,
            payload: JSON.stringify({ from: company.address, to: org.address, as: '' })
        });
        grpcAccount.join(transaction, callback);
    });

    it('should create users1 account', done => {
        function callback(err, res) {
            if (err) { done(err); return; }
            try {
                const payload = JSON.parse(res.payload);
                user1 = payload.account;
                expect(res.code).toBe(0);    // grpc.status.OK
                done();
            } catch (err) { done(err); }
        }

        var transaction = { sender: "", payload: "", signature: "" }
        grpcAccount.create(transaction, callback);
    });

    it('should create user2 account', done => {
        function callback(err, res) {
            if (err) { done(err); return; }
            try {
                const payload = JSON.parse(res.payload);
                user2 = payload.account;
                expect(res.code).toBe(0);    // grpc.status.OK
                done();
            } catch (err) { done(err); }
        }

        var transaction = { sender: "", payload: "", signature: "" }
        grpcAccount.create(transaction, callback);
    });

    // CREATE COIN, MINE & TRANSFERS

    it('should create coin', done => {
        function callback(err, res) {
            if (err) { done(err); return; }
            try {
                const payload = JSON.parse(res.payload);
                coin = payload.coin;
                expect(res.code).toBe(0);    // grpc.status.OK
                done();
            } catch (err) { done(err); }
        }

        var transaction = LCLTCrypto.signTransaction(sender.private, {
            sender: sender.address,
            payload: JSON.stringify({ 
                org_address: org.address, 
                code: 'PDA', 
                name: 'Platja d\'Aro', 
                equal: 'euro' })
        });
        grpcCoin.create(transaction, callback);
    });

    it('should mine coin', done => {
        function callback(err, res) {
            if (err) { done(err); return; }
            try {
                const payload = JSON.parse(res.payload);
                expect(res.code).toBe(0);    // grpc.status.OK
                done();
            } catch (err) { done(err); }
        }

        var transaction = LCLTCrypto.signTransaction(sender.private, {
            sender: sender.address,
            payload: JSON.stringify({ 
                coin_address: coin.address,
                org_address: org.address,
                count: 1000 })
        });
        grpcCoin.mine(transaction, callback);
    });

    it('should transfer coin from org to sender', done => {
        function callback(err, res) {
            if (err) { done(err); return; }
            try {
                const payload = JSON.parse(res.payload);
                expect(res.code).toBe(0);    // grpc.status.OK
                done();
            } catch (err) { done(err); }
        }

        var transaction = LCLTCrypto.signTransaction(sender.private, {
            sender: sender.address,
            payload: JSON.stringify({ 
                from: org.address, 
                to: sender.address,
                coin_address: coin.address,
                count: 100 })
        });
        grpcCoin.transfer(transaction, callback);
    });
   
    it('should fail transfer coins to many users', done => {
        function callback(err, res) {
            if (err) {
                expect(() => {
                    throw (err); 
                }).toThrow();
                done()
            }
        }
        
        var tos = [user1.address, user2.address];
        var transaction = LCLTCrypto.signTransaction(sender.private, {
            sender: sender.address,
            payload: JSON.stringify({ 
                from: org.address, 
                tos: tos,
                coin_address: coin.address,
                count: 500
            })
        });
        
        grpcCoin.transferTos(transaction, callback);
    });

    it('should transfer coins to many users', done => {
        function callback(err, res) {
            if (err) { done(err); return; }
            try {
                const payload = JSON.parse(res.payload);
                //user2 = payload.account;
                expect(res.code).toBe(0);    // grpc.status.OK
                done();
            } catch (err) { done(err); }
        }
        
        var tos = [user1.address, user2.address];
        var transaction = LCLTCrypto.signTransaction(sender.private, {
            sender: sender.address,
            payload: JSON.stringify({ 
                from: org.address, 
                tos: tos,
                coin_address: coin.address,
                count: 400
            })
        });
        
        grpcCoin.transferTos(transaction, callback);
    });

    // READ ACCOUNTS

    it('should read coin & payload.info.code == PDA', done => {
        function callback(err, res) {
            if (err) { done(err); return; }
            try {
                const payload = JSON.parse(res.payload);
                expect(res.code).toBe(0);    // grpc.status.OK
                expect(payload.coin.info.code).toBe('PDA');
                expect(payload.coin.info.code).toBe(coin.info.code);
                done();
            } catch (err) { done(err); }
        }

        var transaction = LCLTCrypto.signTransaction(sender.private, {
            sender: sender.address,
            payload: JSON.stringify({ address: coin.address })
        });
        grpcCoin.read(transaction, callback);
    });

    it('should read sender & payload.info.type == user', done => {
        function callback(err, res) {
            if (err) { done(err); return; }
            try {
                const payload = JSON.parse(res.payload);
                expect(res.code).toBe(0);    // grpc.status.OK
                expect(payload.account.info.type).toBe('users');
                expect(payload.account.info.balances[coin.address]).toBe(100);
                done();
            } catch (err) { done(err); }
        }

        var transaction = LCLTCrypto.signTransaction(sender.private, {
            sender: sender.address,
            payload: JSON.stringify({ address: sender.address })
        });
        grpcAccount.read(transaction, callback);
    });

    it('should read company & payload.info.type == companies', done => {
        function callback(err, res) {
            if (err) { done(err); return; }
            try {
                const payload = JSON.parse(res.payload);
                expect(res.code).toBe(0);    // grpc.status.OK
                expect(payload.account.info.type).toBe('companies');
                //expect(payload.account.info.balances[coin.address]).toBe(100);
                done();
            } catch (err) { done(err); }
        }

        var transaction = LCLTCrypto.signTransaction(sender.private, {
            sender: sender.address,
            payload: JSON.stringify({ address: company.address })
        });
        grpcAccount.read(transaction, callback);
    });

    it('should read org & payload.info.type == orgs', done => {
        function callback(err, res) {
            if (err) { done(err); return; }
            try {
                const payload = JSON.parse(res.payload);
                expect(res.code).toBe(0);    // grpc.status.OK
                expect(payload.account.info.type).toBe('orgs');
                expect(payload.account.info.balances[coin.address]).toBe(100);  // 1000 - 100
                done();
            } catch (err) { done(err); }
        }

        var transaction = LCLTCrypto.signTransaction(sender.private, {
            sender: sender.address,
            payload: JSON.stringify({ address: org.address })
        });
        grpcAccount.read(transaction, callback);
    });

    it('should read user1 & payload.info.type == user', done => {
        function callback(err, res) {
            if (err) { done(err); return; }
            try {
                const payload = JSON.parse(res.payload);
                expect(res.code).toBe(0);    // grpc.status.OK
                expect(payload.account.info.type).toBe('users');
                expect(payload.account.info.balances[coin.address]).toBe(400);
                //expect(payload.account.info.balances).toBeUndefined();
                done();
            } catch (err) { done(err); }
        }

        var transaction = LCLTCrypto.signTransaction(sender.private, {
            sender: sender.address,
            payload: JSON.stringify({ address: user1.address })
        });
        grpcAccount.read(transaction, callback);
    });

    it('should read user2 & payload.info.type == user', done => {
        function callback(err, res) {
            if (err) { done(err); return; }
            try {
                const payload = JSON.parse(res.payload);
                expect(res.code).toBe(0);    // grpc.status.OK
                expect(payload.account.info.type).toBe('users');
                expect(payload.account.info.balances[coin.address]).toBe(400);
                //expect(payload.account.info.balances).toBeUndefined();
                done();
            } catch (err) { done(err); }
        }

        var transaction = LCLTCrypto.signTransaction(sender.private, {
            sender: sender.address,
            payload: JSON.stringify({ address: user2.address })
        });
        grpcAccount.read(transaction, callback);
    });

    // CHECKS BLOCKCHAIN

    it('should check blockchain', done => {
        function callback(err, res) {
            if (err) { done(err); return; }
            try {
                const payload = JSON.parse(res.payload);
                expect(res.code).toBe(0);    // grpc.status.OK
                done();
            } catch (err) { done(err); }
        }

        var transaction = LCLTCrypto.signTransaction(sender.private, {
            sender: sender.address,
            payload: ""
        });
        grpcBlockchain.check(transaction, callback);
    });

    it('should get last block', done => {
        function callback(err, res) {
            if (err) { done(err); return; }
            try {
                const payload = JSON.parse(res.payload);
                expect(res.code).toBe(0);    // grpc.status.OK
                                                        // CHECK THIS -> SOMETIMES 10 OR 11
                                                        // FOR THIS: it('should transfer coins to many users', done => {
                expect(payload.block.count).toBe(10);
                const transactions = payload.block.transactions;
                expect(transactions[0].count).toBe(400);
                expect(transactions[1].count).toBe(400);
                done();
            } catch (err) { done(err); }
        }

        var transaction = LCLTCrypto.signTransaction(sender.private, {
            sender: sender.address,
            payload: ""
        });
        grpcBlockchain.getLastBlock(transaction, callback);
    });
});
