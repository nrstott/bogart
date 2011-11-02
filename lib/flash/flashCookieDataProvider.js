var security        = require("../security"),
    util            = require("../util");

module.exports = CookieDataProvider;

function CookieDataProvider(options) {
  this.options = options || {};
  this.flashData = {};
}

CookieDataProvider.prototype.previousFlash = function(req, flashId) {
  var cookies = util.parseCookies(req);
  if (cookies && cookies[flashId]) {
    return JSON.parse(security.decrypt(decodeURIComponent(cookies[flashId])));
  } else return null;
};

CookieDataProvider.prototype.setter = function(req, flashId) {
  this.flashData[flashId] = {};
  var self = this;
  return function(data) {
    Object.keys(data).forEach(function(key) {
      self.flashData[flashId][key] = data[key];
    });
  };
};

CookieDataProvider.prototype.finalize = function(req, res, flashId) {
  res = res || {};
  res.headers = res.headers || {};
  res.headers["Set-Cookie"] = res.headers["Set-Cookie"] || [];
  var data = this.flashData[flashId];
  delete this.flashData[flashId];

  var cookie = flashId + "=" + encodeURIComponent(security.encrypt(JSON.stringify(data))) + ";";

  if (Object.prototype.toString.call(res.headers["Set-Cookie"]) === "[object String]") {
    var existing = res.headers["Set-Cookie"];
    res.headers["Set-Cookie"] = [];
    res.headers["Set-Cookie"].push(existing);
  }
  res.headers["Set-Cookie"].push(cookie);

  return res;
};


CookieDataProvider.prototype.clear = function(req, res, flashId) {
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