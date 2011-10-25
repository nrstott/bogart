var security = require("./security"),
	flashData = {};


exports.previousFlash = function(req, flashId) {
    if (req.headers && req.headers.cookie && req.headers.cookie[flashId]) {
        return security.decrypt(req.headers.cookie[flashId]);
    } else return null;
};


exports.setter = function(req, flashId) {
    flashData[flashId] = {};

    return function(data) {
        Object.keys(data).forEach(function(key) {
            flashData[flashId][key] = data[key];
        });
    };
};

exports.finalize = function(req, res, flashId) {
    res = res || {};
    res.headers = res.headers || {};
    res.headers["Set-Cookie"] = res.headers["Set-Cookie"] || [];
    var data = flashData;
    flashData = {};

    var cookie = flashId + "=" + security.encrypt(JSON.stringify(data));

    if (Object.prototype.toString.call(res.headers["Set-Cookie"]) === "[object String]") {
        var existing = res.headers["Set-Cookie"];
        res.headers["Set-Cookie"] = [];
        res.headers["Set-Cookie"].push(existing);
    }
    res.headers["Set-Cookie"].push(cookie);

    return res;
};


exports.clear = function(req, res, flashId) {
    if (req.headers && req.headers.cookie && req.headers.cookie[flashId]) {
        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        var clearCookie = flashId + "=expiring; Expires=" + yesterday.toUTCString();

        if (Object.prototype.toString.call(res.headers["Set-Cookie"]) === "[object String]") {
            var existing = res.headers["Set-Cookie"];
            res.headers["Set-Cookie"] = [];
            res.header["Set-Cookie"].push(existing);
        }

        res.headers["Set-Cookie"] = res.headers["Set-Cookie"].filter(function(el) {
            return !(new RegExp("^" + flashId + "=").test(el));
        }).push(clearCookie);
    }

    return res;
};