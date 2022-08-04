var crypto = require('crypto');

function getAlgorithm(keyBase64) {

    var key = Buffer.from(keyBase64, 'base64');
    switch (key.length) {
        case 16:
            return 'aes-128-cbc';
        case 32:
            return 'aes-256-cbc';

    }

    throw new Error('Invalid key length: ' + key.length);
}


function encrypt(plainText, keyBase64, ivBase64) {

    const key = Buffer.from(keyBase64, 'base64');
    const iv  = Buffer.from(ivBase64, 'base64');

    const cipher  = crypto.createCipheriv(getAlgorithm(keyBase64), key, iv.slice(0, 16));
    let encrypted = cipher.update(plainText, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
}

function decrypt(messagebase64, keyBase64, ivBase64) {

    const key = Buffer.from(keyBase64, 'base64');
    const iv  = Buffer.from(ivBase64, 'base64');

    const decipher = crypto.createDecipheriv(getAlgorithm(keyBase64), key, iv.slice(0, 16));
    let decrypted  = decipher.update(messagebase64, 'base64');
    decrypted += decipher.final();
    return decrypted;
}


var keyBase64 = "DWIzFkO22qfVMgx2fIsxOXnwz10pRuZfFJBvf4RS3eY=";
var ivBase64  = 'e3a74e3c7599f3ab4601d587bd2cc768';
var plainText = '<Request xmlns="http://www.kotak.com/schemas/CorpCCPaymentsOTP/CorpCCPaymentsOTP.xsd"><username>ENKASH</username><password>Corp@123</password><SrcAppCd>ENKA SH</SrcAppCd><RefNo>Ref1111111111</RefNo><CardNo>4280933990002698</CardNo ><OTP>12345</OTP></Request>';

var cipherText          = encrypt(plainText, keyBase64, ivBase64);
var decryptedCipherText = decrypt(cipherText, keyBase64, ivBase64);

console.log('Algorithm: ' + getAlgorithm(keyBase64));
console.log('Plaintext: ' + plainText);
console.log('Ciphertext: ' + cipherText);
console.log('Decoded Ciphertext: ' + decryptedCipherText);