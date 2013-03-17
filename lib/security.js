var crypto = require('crypto'),
    secretCipherPass = "SDFOIJSDFJLKJ";

exports.hash = function(value) {
    var shasum = crypto.createHash('sha1');
    shasum.update(value);
    return shasum.digest('hex');
}

exports.encrypt = function(valueToEncrypt) {
    var key = arguments[1] || secretCipherPass;
    var cipher = crypto.createCipher('aes-256-cbc', key);

    var str = cipher.update(valueToEncrypt, 'utf8', 'hex');
    str += cipher.final('hex') || '';
    return str;
}

exports.decrypt = function(valueToDecrypt) {
    var key = arguments[1] || secretCipherPass;
    var cipher = crypto.createDecipher('aes-256-cbc', key);
        
        
    var str = cipher.update(valueToDecrypt, 'hex', 'utf8');
    str += cipher.final('utf8') || '';
    return str;
}
