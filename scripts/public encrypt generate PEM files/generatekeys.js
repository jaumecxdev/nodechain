// node generatekeys.js

const fs = require("fs");
const crypto = require("crypto")

// The `generateKeyPairSync` method accepts two arguments:
// 1. The type ok keys we want, which in this case is "rsa"
// 2. An object with the properties of the key
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
	// The standard secure default length for RSA keys is 2048 bits
	modulusLength: 2048,
    publicKeyEncoding: {
        type: 'spki',
        format: "pem",
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: "pem",
        cipher: 'aes-256-cbc',
        passphrase: 'Anem_a_buscar_la_bola_de_drac_Envoltada_en_un_misteri,és_Un_gran_secret.Anem-la_a_agafar,La_bola_de_drac,Entre_tots_els_misteris,él_Més_divertit.'
    },
})

console.log(publicKey);
console.log(privateKey);

fs.writeFileSync('tmp_public_key.pem', publicKey, {encoding: "utf8", mode: 0o666, flag: "w"});
fs.writeFileSync('tmp_private_key.pem', privateKey, {encoding: "utf8", mode: 0o666, flag: "w"});

function encryptText(plainText) {
    return crypto.publicEncrypt({
        key: fs.readFileSync('tmp_public_key.pem', 'utf8'),
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
        //passphrase: 'Anem_a_buscar_la_bola_de_drac_Envoltada_en_un_misteri,és_Un_gran_secret.Anem-la_a_agafar,La_bola_de_drac,Entre_tots_els_misteris,él_Més_divertit.'
    },
    // We convert the data string to a buffer
    Buffer.from(plainText)
    )
}
  
function decryptText(encryptedText) {
    return crypto.privateDecrypt(
        {
            key: fs.readFileSync('tmp_private_key.pem', 'utf8'),
            // In order to decrypt the data, we need to specify the
            // same hashing function and padding scheme that we used to
            // encrypt the data in the previous step
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256',
            passphrase: 'Anem_a_buscar_la_bola_de_drac_Envoltada_en_un_misteri,és_Un_gran_secret.Anem-la_a_agafar,La_bola_de_drac,Entre_tots_els_misteris,él_Més_divertit.'
        },
        encryptedText
    )
}

const plainText = "simple text";

// Encrypt text 
// encryptedText will be returned as Buffer
// in order to see it in more readble form, convert it to base64
const encryptedText = encryptText(plainText)
console.log('encrypted text: ', encryptedText.toString('base64'))

// Decrypt string
const decryptedText = decryptText(encryptedText)
console.log('decrypted text:', decryptedText.toString())

// Decrypt from base64 string
const base64Encrypted = encryptedText.toString('base64')
const decryptedText64 = decryptText(Buffer.from(base64Encrypted, 'base64'))
console.log('decrypted base64 text:', decryptedText64.toString())