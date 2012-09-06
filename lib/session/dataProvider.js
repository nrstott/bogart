var uuid = require("node-uuid"),
    security = require("../security"),
    util = require("../util"),
    SESSION_DATA_COOKIE = "bogart_session_data",
    DEFAULT_SESSION_LIFETIME = 1800 /* 30 mins */;

exports.DataProvider = DataProvider;

function DataProvider(config) {
    config = config || {};
    config.lifetime = config.lifetime || DEFAULT_SESSION_LIFETIME;
    config.encryptionKey = config.encryptionKey || "2d5ff9be-0758-11e1-a2f5-000c290196f7";

    this.config = config;
    this.cookieKey = encodeURIComponent(security.encrypt(SESSION_DATA_COOKIE, this.config.encryptionKey));
}

/**
 * Called once at the beginning of the request
 */
DataProvider.prototype.loadSession = function(req, sessionId) {
    var self = this;
    var cookie = util.parseCookies(req)[this.cookieKey];
    req.env = req.env || {};
    req.env.session = req.env.session || {};
    req.env.session[sessionId] = cookie ? JSON.parse(security.decrypt(decodeURIComponent(cookie), this.config.encryptionKey)) : {};

    // set up the session function
    req.session = function() {
        var args = Array.prototype.slice.call(arguments);
        if (args.length === 2) {
            req.env.session[sessionId][args[0]] = args[1];
        } else {
            return req.env.session[sessionId][args[0]];
        }
    };

    req.session.keys = function() {
        return Object.keys(req.env.session[sessionId]);
    };
};

/**
 *	Called once at the end of the request
 */
DataProvider.prototype.save = function(req, res, sessionId) {
	var self = this;
    res = res || {};
    res.headers = res.headers || {};
    res.headers["Set-Cookie"] = res.headers["Set-Cookie"] || [];
    var expires = new Date();
    expires.setSeconds(expires.getSeconds() + this.config.lifetime);
    var sData = JSON.stringify(req.env.session[sessionId]);

    var cookie = self.cookieKey + "=" + encodeURIComponent(security.encrypt(sData, this.config.encryptionKey)) + "; Path=/; Expires=" + expires.toUTCString() + ";";
    
    res = util.ensureSetCookieArray(res);
    res.headers["Set-Cookie"] = res.headers["Set-Cookie"].filter(function(el) {
        return !(new RegExp("^" + self.cookieKey + "=").test(el));
    });
    res.headers["Set-Cookie"].push(cookie);

    return res;
};