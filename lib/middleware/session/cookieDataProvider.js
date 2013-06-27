var uuid = require("node-uuid"),
    security = require("../../security"),
    util = require("../../util"),
    SESSION_DATA_COOKIE = "bogart_session_data",
    DEFAULT_SESSION_LIFETIME = 1800 /* 30 mins */;

function CookieDataProvider(config) {
    config = config || {};
    config.lifetime = config.lifetime || DEFAULT_SESSION_LIFETIME;
    config.encryptionKey = config.encryptionKey || "2d5ff9be-0758-11e1-a2f5-000c290196f7";

    this.encrypt = config.encrypt || security.encrypt;
    this.decrypt = config.decrypt || security.decrypt;

    this.config = config;
    this.cookieKey = encodeURIComponent(this.encrypt(SESSION_DATA_COOKIE, this.config.encryptionKey));
}

/**
 * Called once at the beginning of the request
 */
CookieDataProvider.prototype.loadSession = function(req, sessionId) {
    var self = this
      , cookie = util.parseCookies(req)[this.cookieKey]
      , session = cookie ? JSON.parse(this.decrypt(decodeURIComponent(cookie), this.config.encryptionKey)) : {};

    return session;
};

/**
 *	Called once at the end of the request
 */
CookieDataProvider.prototype.save = function(req, res, sessionId) {
	var self = this;
    res = res || {};
    res.headers = res.headers || {};
    res.headers["Set-Cookie"] = res.headers["Set-Cookie"] || [];
    var expires = new Date();
    expires.setSeconds(expires.getSeconds() + this.config.lifetime);
    var sData = JSON.stringify(req.env.session);

    var cookie = self.cookieKey + "=" + encodeURIComponent(security.encrypt(sData, this.config.encryptionKey)) + "; Path=/; Expires=" + expires.toUTCString() + ";";
    
    res = util.ensureSetCookieArray(res);
    res.headers["Set-Cookie"] = res.headers["Set-Cookie"].filter(function(el) {
        return !(new RegExp("^" + self.cookieKey + "=").test(el));
    });
    res.headers["Set-Cookie"].push(cookie);

    return res;
};

module.exports = CookieDataProvider;
