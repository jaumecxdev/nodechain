const mongoose = require('mongoose');
// https://mongoosejs.com/docs/schematypes.html

const WorldSchema = new mongoose.Schema({
    address: {
        type: String,
        required: true,
        unique: true
    },
    public: { 
        type: String,
        required: true
    },
    private: {              // REMOVE IN PROD
        type: String
    },
    // account, coin, asset, group, ...
    datatype: {
        type: String,
        required: true
    },
    // datatype: account -> info.type: users, orgs, companies
    info: {
        type: {},
    },
});

WorldSchema.method('lcltSetInfo', async function (key, value) {
    this.info[key] = value;
    this.markModified(['info.'+key]);
    await this.save();

    return this;
});

WorldSchema.method('lcltInsertInfoPermit', async function (type, address, role) {
    this.info['permits'] = this.info['permits'] ?? {};
        
    if (this.info.permits[type] == null) {
        this.info.permits[type] = {};
    }
    this.info.permits[type][address] = role;
    this.markModified('info.permits');
    await this.save();

    return this;
});

WorldSchema.method('lclHasInfoPermitRoles', function (type, address, roles) {
    if (this.info.permits != null &&  
        this.info.permits[type] != null && 
        this.info.permits[type][address] != null &&
        roles.includes(this.info.permits[type][address])) {

        return true;
    }

    return false;
});

WorldSchema.method('lcltAddInfoBalance', async function (address, count) {
    this.info['balances'] = this.info['balances'] ?? {};
    if (this.info.balances[address] == null) {
        this.info.balances[address] = 0;
    }
    this.info.balances[address] += count;
    this.markModified('info.balances');
    await this.save();

    return this;
});

WorldSchema.method('lcltSubInfoBalance', async function (address, count) {
    this.info['balances'] = this.info['balances'] ?? {};
    if (this.info.balances[address] == null) {
        this.info.balances[address] = 0;
    }
    this.info.balances[address] -= count;
    this.markModified('info.balances');
    await this.save();

    return this;
});

WorldSchema.method('lcltHasInfoEnoughBalance', function (address, count) {
    if (this.info.balances != null && 
        this.info.balances[address] != null && 
        this.info.balances[address] >= count) {

        return true;
    }

    return false;
});

const World = new mongoose.model('World', WorldSchema);

module.exports = {
    World, WorldSchema
}
  