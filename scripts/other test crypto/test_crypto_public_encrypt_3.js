const { generateKeyPairSync, publicEncrypt, privateDecrypt } = require('crypto');

//generate a key pair RSA type encryption with a .pem format
const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  }
});
// print out the generated keys
console.log(`PublicKey: ${publicKey}`);
console.log(`PrivateKey: ${privateKey}`);
//message to be encrypted
var toEncrypt = "my secret text to be encrypted";
var encryptBuffer = Buffer.from(toEncrypt);
//encrypt using public key
var encrypted = publicEncrypt(publicKey,encryptBuffer);
//print out the text and cyphertext
console.log("Text to be encrypted:");
console.log(toEncrypt);
console.log("cipherText:");
console.log(encrypted.toString());
//decrypt the cyphertext using the private key
var decryptBuffer = Buffer.from(encrypted.toString("base64"), "base64");
var decrypted = privateDecrypt(privateKey,decryptBuffer);
//print out the decrypted text
console.log("decripted Text:");
console.log(decrypted.toString());