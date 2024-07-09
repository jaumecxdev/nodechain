

//  [DEP0106] DeprecationWarning: crypto.createCipher is deprecated.


var crypto = require('crypto');
var alice = crypto.getDiffieHellman('modp5');
var bob = crypto.getDiffieHellman('modp5');
alice.generateKeys();
bob.generateKeys();
var alice_secret = alice.computeSecret(bob.getPublicKey(), null, 'hex');
var bob_secret = bob.computeSecret(alice.getPublicKey(), null, 'hex');
/* alice_secret and bob_secret should be the same */
console.log(alice_secret);
console.log(bob_secret);
console.log(alice_secret == bob_secret);

var encrypt64 = function(aMsg, aSecret) {
    var cipher, tRet;
    cipher = crypto.createCipher('aes-256-cbc', aSecret);
    tRet = cipher.update(aMsg, 'utf8', 'base64');
    tRet += cipher.final('base64');
    return tRet;
};
var decrypt64 = function(aMsg, aSecret) {
    var decipher, tRet;
    decipher = crypto.createDecipher('aes-256-cbc', aSecret);
    tRet = decipher.update(aMsg.replace(/\s/g, "+"), 'base64', 'utf8');
    tRet += decipher.final('utf8');
    return tRet;
};

var toEncrypt = "my secret text to be encrypted";
console.log("Text to be encrypted:");
console.log(toEncrypt);

var encrypted = encrypt64(toEncrypt, alice_secret);
console.log("cipherText:");
console.log(encrypted.toString());

var decrypted = decrypt64(encrypted, alice_secret);
console.log("decripted Text:");
console.log(decrypted.toString());