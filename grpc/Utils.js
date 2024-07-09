require('dotenv').config();
const { World } = require('../mongo/models/World');
const LCLTCrypto = require('./LCLTCrypto');

class CodeError extends Error {
    constructor(args){
        super(args);
        this.code = args.code;
        this.message = ['development', 'test'].includes(process.env.NODE_ENV) ? args.message : "";
    }
}


const secureJsonParse = (str) => {
    try{
       return JSON.parse(str);
    }catch (e){
       return {};
    }
}


const accountTypes = [ 'orgs', 'companies', 'users' ];
// at[1] == 'company'
// at[at.company] == 1
const getAccountTypes = () => {
    let at = [];
    accountTypes.forEach((a, i) => { at[a] = i; });     // CHANGE FOR: for (const node of nodes) {
    return at;
}


const getErrorResponse = (err, code, message) => {
    return {
        code: code,
        payload: JSON.stringify({
            error: {
                message: message,
                // details: err.message
            }
        }),
    }
}


const checkgRPCRequest = async (request) => {

    if (request.sender == null || request.payload == null || request.signature == null) {
        console.log("Sender, Payload & Signature are required");
        //callback({ code: grpc.status.NOT_FOUND, details: "Error creating new account" });
        return;
    }

    // Check Sender's account exists && is type 'users'
    const sender = await World.findOne({ datatype: 'account', ['info.type']: 'users', address: request.sender }).exec();
    if (sender == null) {
        console.log("No sender found");
        //callback({ code: grpc.status.NOT_FOUND, details: "No sender found" });
        return;
    }

    const verified = LCLTCrypto.verifySignedTransaction(sender.public, request);
    if (!verified) {
        console.log("No verified");
        //callback({ code: grpc.status.NOT_FOUND, details: "No verified" });
        return;
    }

    return sender;
}


const acquireTransferLock = (address) => {
    if (address != null) {
        global.app.secureTransfer[address] = true;
    }
}

const releaseTransferLock = (address) => {
    if (address != null) {
        global.app.secureTransfer[address] = false;
    }
}

const isTransferLock = (address) => {
    if (address != null) {
        return (global.app.secureTransfer[address] != null && global.app.secureTransfer[address]);
    }
}

const acquireTransferAllLock = (addresses) => {
    for (const address of addresses) {
        acquireTransferLock(address);
    }
}

const releaseTransferAllLock = (addresses) => {
    for (const address of addresses) {
        releaseTransferLock(address);
    }
}

const isTransferAnyLock = (addresses) => {
    for (const address of addresses) {
        if (isTransferLock(address)) {
            return true;
        }
    }
    
    return false;
}

const callbackReleaseTransferLock = (callback, err = null, data = null, from_address = null, to_address = null) => {
    releaseTransferLock(from_address);
    releaseTransferLock(to_address);
    callback(err, data);
    //return;
}

const callbackReleaseTransferAllLock = (callback, err = null, data = null, from_addresses = [], to_addresses = []) => {
    for (const from_address of from_addresses) {
        releaseTransferLock(from_address);
    }
    for (const to_address of to_addresses) {
        releaseTransferLock(to_address);
    }
    callback(err, data);
    //return;
}

//exports.waitUntil = (interval, times, condition, cb) => {
const waitUntil = (interval, times, condition, cb) => {
//module.exports = exports = function waitUntil(interval, times, condition, cb) {
    if (typeof interval == 'undefined') {
        return new WaitUntil();
    } else {
        return new WaitUntil()
            .interval(interval)
            .times(times)
            .condition(condition)
            .done(cb);
    }
};

function WaitUntil() {
    var self = this;
}

WaitUntil.prototype.interval = function(_interval) {
    var self = this;

    self._interval = _interval;
    return self;
};

WaitUntil.prototype.times = function(_times) {
    var self = this;

    self._times = _times;
    return self;
};

WaitUntil.prototype.condition = function(_condition, cb) {
    var self = this;

    self._condition = _condition;
    if (cb) {
        return self.done(cb);
    } else {
        return self;
    }
};

WaitUntil.prototype.done = function(cb) {
    var self = this;

    if (!self._times) {
        throw new Error('waitUntil.times() not called yet');
    }
    if (!self._interval) {
        throw new Error('waitUntil.interval() not called yet');
    }
    if (!self._condition) {
        throw new Error('waitUntil.condition() not called yet');
    }

    (function runCheck(i, prevResult) {
        if (i == self._times) {
            cb(prevResult);
        } else {
            setTimeout(function() {
                function gotConditionResult(result) {
                    if (result) {
                        cb(result);
                    } else {
                        runCheck(i + 1, result);
                    }
                }

                if (self._condition.length) {
                    self._condition(gotConditionResult);
                } else {
                    // don't release Zalgo
                    process.nextTick(function() {
                        gotConditionResult(self._condition());
                    });
                }
            }, self._interval);
        }
    })(0);

    return self;
};


const sleepUntil = async (payload, f, ff, timeoutMs) => {
    return new Promise((resolve, reject) => {
      const timeWas = new Date();
      const wait = setInterval(function() {
        if (f()) {
            console.log("resolved after", new Date() - timeWas, "ms");
            ff();
            clearInterval(wait);
            resolve();
        } else if (new Date() - timeWas > timeoutMs) { // Timeout
            console.log("rejected after", new Date() - timeWas, "ms");
            clearInterval(wait);
            reject();
        }
      }, 20);
    });
}

async function sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
}


module.exports = {
    CodeError,
    secureJsonParse,
    accountTypes,
    getAccountTypes,
    getErrorResponse,
    checkgRPCRequest,
    acquireTransferLock,
    releaseTransferLock,
    isTransferLock,
    acquireTransferAllLock,
    releaseTransferAllLock,
    isTransferAnyLock,
    callbackReleaseTransferLock,
    callbackReleaseTransferAllLock
}