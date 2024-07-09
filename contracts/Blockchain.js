const crypto = require("crypto");
const { CodeError } = require('../grpc/Utils');
const { Block } = require('../mongo/models/Block')

class Blockchain
{
    constructor() {
        // Get last block
        Block.findOne().sort({ createdAt: -1 }).then((block) => {
            //this.lastBlock = new Block(blockModel);
            // 1 block == 1 transaction
            this.lastBlock = block;
            if (block == null) {
                this.addGenesis();
            }
        });
    }

    addGenesis() {
        return this.saveBlock(0, "0", []);
    }

    async addBlock(transactions) {
        return await this.saveBlock(++this.lastBlock.count, this.lastBlock.hash, transactions);
    }

    async saveBlock(count, previousHash, transactions) {

        try {
            if (this.isBlockchainLock()) {
                setTimeout(async () => {
                    await this.saveBlock(count, previousHash, transactions);
                }, 1000);
            }
            else {
                this.acquireBlockchainLock();
                let createdAt = Date.now();
                let nonce = crypto.randomInt(0, 128);
                if (!Array.isArray(transactions)) {
                    transactions = [transactions];
                }

                const block = new Block({
                    count: count,
                    createdAt: createdAt,
                    //hash: hash,
                    previousHash: previousHash,
                    nonce: nonce,
                    transactions: transactions
                });

                block.hash = await block.lcltCalcHash();
                block.markModified('createdAt');
                block.markModified('transactions');      // Array ???

                this.lastBlock = block;
                await block.save();
                if (this.lastBlock == null) {
                    console.log("Error saveBlock kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk");
                    this.releaseBlockchainLock();
                    return;
                }

                this.releaseBlockchainLock();
                return block.hash;
            }
    
        } catch (error) {
            this.releaseBlockchainLock();
            return;
        }
    }

    acquireBlockchainLock() {
        global.app.blockchainLock = true;
    }
    
    releaseBlockchainLock() {
        global.app.blockchainLock = false;
    }

    isBlockchainLock() {
        return global.app.blockchainLock;
    }

    getLastBlock() {

        return this.lastBlock;
    }

    async getBlockByCount(count) {
        try {
            var block = await Block.find({ count: count }).exec();
            if (!block) {
                throw new CodeError({ code: grpc.status.NOT_FOUND, message: "No block found" });
            }

            return block;

        } catch (error) {
            return error;
        }
    }

    async getBlockByHash(hash) {
        try {
            var block = await Block.find({ hash: hash }).exec();
            if (!block) {
                throw new CodeError({ code: grpc.status.NOT_FOUND, message: "No block found" });
            }

            return block;

        } catch (error) {
            return error;
        }
    }

    async check() {
        // OPTIMIZE WHEN IN PRODUCTION
        var previousBlock = null;
        await Block.find().sort({ createdAt: 1 }).then((blocks) => {

            for (const block of blocks) {
                if (previousBlock == null) {
                    //previousBlock = new Block(block);
                    previousBlock = block;
                }
                else {
                    //currentBlock = new Block(blockModel);
                    //currentBlock = blockModel;
                    if (block.hash !== block.lcltCalcHash()) {
                        return false;
                    }
                    if (block.previousHash !== previousBlock.hash) {
                        return false;
                    }
                    if (block.count !== ++previousBlock.count) {
                        return false;
                    }
    
                    previousBlock = block;
                }
            }
        });

        return true;
    }
}

module.exports = {
    Blockchain
}