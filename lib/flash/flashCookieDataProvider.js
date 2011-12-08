var security        = require("../security"),
    util            = require("../util"),
    DEFAULT_ENCRYPTION_KEY = "a720efa0-04e8-11e1-a8b5-000c290196f7",
    COOKIE_NAME     = "jsgi_flash_data";



module.exports = CookieDataProvider;

function CookieDataProvider(options) {
  this.options = options || {};
  this.flashData = {};
}

CookieDataProvider.prototype.previousFlash = function(req, flashId) {
  var cookies = util.parseCookies(req);
  if (cookies && cookies[COOKIE_NAME]) {
    var hold = security.decrypt(decodeURIComponent(cookies[COOKIE_NAME]), this.options.encryptionKey || DEFAULT_ENCRYPTION_KEY);
    return hold === "" ? {} : JSON.parse(hold);
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

  var cookie = COOKIE_NAME + "=" + encodeURIComponent(security.encrypt(JSON.stringify(data), this.options.encryptionKey || DEFAULT_ENCRYPTION_KEY)) + ";Path=/;";

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
  if (cookies && cookies[COOKIE_NAME]) {
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    var clearCookie = COOKIE_NAME + "=expiring; Expires=" + yesterday.toUTCString() + ";Path=/;";

    if (Object.prototype.toString.call(res.headers["Set-Cookie"]) === "[object String]") {
      var existing = res.headers["Set-Cookie"];
      res.headers["Set-Cookie"] = [];
      res.headers["Set-Cookie"].push(existing);
    }

    res.headers["Set-Cookie"] = res.headers["Set-Cookie"].filter(function(el) {
      return !(new RegExp("^" + COOKIE_NAME + "=").test(el));
    });
    res.headers["Set-Cookie"].push(clearCookie);
  }

  return res;
};