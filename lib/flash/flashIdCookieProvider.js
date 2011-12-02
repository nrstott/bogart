var uuid      = require("node-uuid"),
  security    = require("../security"),
  util      = require("../util"),
  flashCookieName = "jsgi_flash_session";

module.exports = CookieIdProvider;

function CookieIdProvider(options) {
  this.options = options || {};
}

CookieIdProvider.prototype.getFlashId = function(req) {
  var cookies = util.parseCookies(req);
  if (cookies && cookies[flashCookieName]) {
    return cookies[flashCookieName];
  } else return null;
};

CookieIdProvider.prototype.newId = function(req) {
  return uuid();
};

CookieIdProvider.prototype.finalize = function(req, res, flashId) {
  res = res || {};
  res.headers = res.headers || {};
  res.headers["Set-Cookie"] = res.headers["Set-Cookie"] || [];
  var cookie = flashCookieName + "=" + flashId + ";Path=/;";

  if (Object.prototype.toString.call(res.headers["Set-Cookie"]) === "[object String]") {
    var existing = res.headers["Set-Cookie"];
    res.headers["Set-Cookie"] = [];
    res.headers["Set-Cookie"].push(existing);
  }

  res.headers["Set-Cookie"] = res.headers["Set-Cookie"].filter(function(el) {
    return !(new RegExp("^" + flashCookieName + "=").test(el));
  });
  res.headers["Set-Cookie"].push(cookie);

  return res;
};

CookieIdProvider.prototype.clear = function(req, res, flashId) {
  res = res || {};
  res.headers = res.headers || {};
  res.headers["Set-Cookie"] = res.headers["Set-Cookie"] || [];
  
  var cookies = util.parseCookies(req);
  if (cookies && cookies[flashCookieName]) {
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    var clearCookie = flashCookieName + "=expiring; Expires=" + yesterday.toUTCString() + ";Path=/;";

    if (Object.prototype.toString.call(res.headers["Set-Cookie"]) === "[object String]") {
      var existing = res.headers["Set-Cookie"];
      res.headers["Set-Cookie"] = [];
      res.header["Set-Cookie"].push(existing);
    }

    res.headers["Set-Cookie"] = res.headers["Set-Cookie"].filter(function(el) {
      return !(new RegExp("^" + flashCookieName + "=").test(el));
    });
    res.headers["Set-Cookie"].push(clearCookie);
  }

  return res;
};