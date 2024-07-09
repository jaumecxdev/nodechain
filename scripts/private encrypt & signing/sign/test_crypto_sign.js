const crypto = require('crypto');
const fs = require('fs');
const path = require('path');


const keyPair = crypto.generateKeyPairSync('rsa', {
    modulusLength: 530,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase: ''
    }
});


const signer = crypto.createSign("rsa-sha256");

const message = "some ungodly secrete" 

signer.update(message)

const signatutre = signer.sign({
    key: keyPair.privateKey,
    passphrase: '',
}, "hex");
console.log(signatutre);

const verifier = crypto.createVerify("rsa-sha256")

verifier.update(message)

const verified = verifier.verify(keyPair.publicKey, signatutre, "hex");

console.log(verified);