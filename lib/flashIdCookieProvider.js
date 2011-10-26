var uuid      = require("node-uuid"),
  security    = require("./security"),
  util      = require("./util"),
  flashCookieName = "jsgi_flash_session";


exports.getFlashId = function(req) {
  var cookies = util.parseCookies(req);
  if (cookies && cookies[flashCookieName]) {
    return cookies[flashCookieName];
  } else return null;
};

exports.newId = function(req) {
  return uuid();
};

exports.finalize = function(req, res, flashId) {
  res = res || {};
  res.headers = res.headers || {};
  res.headers["Set-Cookie"] = res.headers["Set-Cookie"] || [];
  var cookie = flashCookieName + "=" + flashId + ";";

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

exports.clear = function(req, res, flashId) {
  res = res || {};
  res.headers = res.headers || {};
  res.headers["Set-Cookie"] = res.headers["Set-Cookie"] || [];
  
  var cookies = util.parseCookies(req);
  if (cookies && cookies[flashCookieName]) {
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    var clearCookie = flashCookieName + "=expiring; Expires=" + yesterday.toUTCString() + ";";

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