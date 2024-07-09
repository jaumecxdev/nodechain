// Node.js program to demonstrate the
// crypto.publicDecrypt() method

// Including crypto, path, and fs module
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generating key files
//function generateKeyFiles() {

	const keyPair = crypto.generateKeyPairSync('rsa', {
		modulusLength: 520,
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

	// Creating public and private key file
	//fs.writeFileSync("public_key444", keyPair.publicKey);
	//fs.writeFileSync("private_key444", keyPair.privateKey);
//}

// Generate keys
//generateKeyFiles();

// Reading private key file
//let PRIVKEY = fs.readFileSync(path.join(__dirname, 'private_key444'), 'utf8');

// Reading public key file
//let PUBKEY = fs.readFileSync(path.join(__dirname, 'public_key444'), 'utf8');

// Defining my msg
myMSG = "GeeksforGeeks!";
console.log("Original msg is : " + myMSG);

// RSA PRIVATE ENCRYPT -> PUBLIC DECRYPT
function privENC_pubDEC(originMSG) {

	// Encrypting msg with privateEncrypt method
	encmsg = crypto.privateEncrypt({
			key: keyPair.privateKey,
			passphrase: '',
		},
		Buffer.from(originMSG, 'utf8'))
		.toString('base64');

	// Decrypting msg with publicDecrypt method
	msg = crypto.publicDecrypt(keyPair.publicKey,
		Buffer.from(encmsg, 'base64'));

	console.log();

	// Prints encrypted msg
	console.log("Encrypted with private key: "
		+ encmsg);

	console.log();

	// Prints decrypted msg
	console.log("Decrypted with public key: "
		+ msg.toString());
}

// Calling privENC_pubDEC() method
privENC_pubDEC(myMSG);
