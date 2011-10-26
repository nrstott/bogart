var security        = require("./security"),
    util            = require("./util"),
    flashData       = {};


exports.previousFlash = function(req, flashId) {
  var cookies = util.parseCookies(req);
  if (cookies && cookies[flashId]) {
    return JSON.parse(cookies[flashId]);
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
  var data = flashData[flashId];
  delete flashData[flashId];

  var cookie = flashId + "=" + JSON.stringify(data) + ";";

  if (Object.prototype.toString.call(res.headers["Set-Cookie"]) === "[object String]") {
    var existing = res.headers["Set-Cookie"];
    res.headers["Set-Cookie"] = [];
    res.headers["Set-Cookie"].push(existing);
  }
  res.headers["Set-Cookie"].push(cookie);

  return res;
};


exports.clear = function(req, res, flashId) {
  res = res || {};
  res.headers = res.headers || {};
  res.headers["Set-Cookie"] = res.headers["Set-Cookie"] || [];

  var cookies = util.parseCookies(req);
  if (cookies && cookies[flashId]) {
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    var clearCookie = flashId + "=expiring; Expires=" + yesterday.toUTCString() + ";";

    if (Object.prototype.toString.call(res.headers["Set-Cookie"]) === "[object String]") {
      var existing = res.headers["Set-Cookie"];
      res.headers["Set-Cookie"] = [];
      res.header["Set-Cookie"].push(existing);
    }

    res.headers["Set-Cookie"] = res.headers["Set-Cookie"].filter(function(el) {
      return !(new RegExp("^" + flashId + "=").test(el));
    });
    res.headers["Set-Cookie"].push(clearCookie);
  }

  return res;
};