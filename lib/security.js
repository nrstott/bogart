var crypto = require('crypto'),
    secretCipherPass = "SDFOIJSDFJLKJ";

exports.hash = function(value) {
    var shasum = crypto.createHash('sha1');
    shasum.update(value);
    return shasum.digest('hex');
}

exports.encrypt = function(valueToEncrypt) {
    var str = '',
        cipher = crypto.createCipher('aes-256-ecb', arguments[1] || secretCipherPass);

    str += cipher.update(valueToEncrypt, 'binary', 'base64');
    str += cipher.final('base64');
    return str;
}

exports.decrypt = function(valueToDecrypt) {
    console.log('decipher', valueToDecrypt);
    var cipher = crypto.createDecipher('aes-256-ecb', arguments[1] || secretCipherPass),
        str = '',
        buf = new Buffer(valueToDecrypt, 'base64');

    str += cipher.update(buf.toString('base64'), 'base64', 'base64');
    str += cipher.final('base64');
    return str;
}