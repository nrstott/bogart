var uuid = require("node-uuid"),
    security = require("../../security"),
    util = require("../../util"),
    SESSION_DATA_COOKIE = "bogart_session_data",
    DEFAULT_SESSION_LIFETIME = 1800 /* 30 mins */;

function CookieDataProvider(config) {
    config = config || {};
    config.lifetime = config.lifetime || DEFAULT_SESSION_LIFETIME;

    if (!config.secret) {
        throw new Error('CookieDataProvider `secret` is required: new CookieDataProvider({ secret: "my-super-secret" })');
    }

    this.encrypt = config.encrypt || security.encrypt;
    this.decrypt = config.decrypt || security.decrypt;

    this.config = config;
    this.cookieKey = encodeURIComponent(this.encrypt(SESSION_DATA_COOKIE, this.config.secret));
}

/**
 * Called once at the beginning of the request
 */
CookieDataProvider.prototype.loadSession = function(req, sessionId) {
    var self = this
      , cookie = util.parseCookies(req)[this.cookieKey]
      , session = cookie ? JSON.parse(this.decrypt(decodeURIComponent(cookie), this.config.secret)) : {};

    return session;
};

/**
 *	Called once at the end of the request
 */
CookieDataProvider.prototype.save = function(req, res, sessionId) {
    return setCookie(req, res, sessionId, this.config.lifetime, this.config.secret, this.cookieKey);
};

CookieDataProvider.prototype.destroy = function (req, res, sessionId) {
    return setCookie(req, res, sessionId, -1, this.config.secret, this.cookieKey);
};

function setCookie(req, res, sessionId, expiresInSeconds, secret, cookieKey) {
    res = res || {};
    res.headers = res.headers || {};
    res.headers["Set-Cookie"] = res.headers["Set-Cookie"] || [];
    var expires = new Date();
    expires.setSeconds(expires.getSeconds() + expiresInSeconds);
    var sData = JSON.stringify(req.env.session);

    var cookie = cookieKey + "=" + encodeURIComponent(security.encrypt(sData, secret)) + "; Path=/; Expires=" + expires.toUTCString() + ";";
    
    res = util.ensureSetCookieArray(res);
    res.headers["Set-Cookie"] = res.headers["Set-Cookie"].filter(function(el) {
        return !(new RegExp("^" + cookieKey + "=").test(el));
    });
    res.headers["Set-Cookie"].push(cookie);

    return res;
}

module.exports = CookieDataProvider;
