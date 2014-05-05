var uuid = require("node-uuid"),
    security = require("../../security"),
    util = require("../../util"),
    format = require('util').format,
    SESSION_ID_COOKIE = "bogart_session_id",
    DEFAULT_SESSION_LIFETIME = 1800;

exports.IdProvider = IdProvider;

function IdProvider(config) {
    config = config || {};
    config.lifetime = config.lifetime || DEFAULT_SESSION_LIFETIME;

    this.config = config;
    this.cookieKey = encodeURIComponent(security.encrypt(SESSION_ID_COOKIE, this.config.secret));
}

/**
 * Called once at the beginning of each request.
 */
IdProvider.prototype.getSessionId = function(req) {
    var cookie = util.parseCookies(req)[this.cookieKey];
    var id;
    if (!cookie) {
        id = uuid();
    } else {
        id = security.decrypt(decodeURIComponent(cookie), this.config.secret);
    }
    return id;
};


/**
 * Modifies the response to include the SessionId
 *
 * @param {Object} req  JSGI Request
 * @param {Object} res  JSGI Response
 * @param {String} sessionId  Unique identifier of the Session.
 *
 * @returns {Object} JSGI Response
 */
IdProvider.prototype.save = function(req, res, sessionId) {
    return setCookie(req, res, sessionId, this.config.lifetime, this.config.secret, this.cookieKey);
};

IdProvider.prototype.destroy = function (req, res, sessionId) {
    return setCookie(req, res, '', -1, this.config.secret, this.cookieKey);
};

function setCookie(req, res, sessionId, expiresInSeconds, secret, cookieKey) {
    res = res || {};
    res.headers = res.headers || {};
    res.headers["Set-Cookie"] = res.headers["Set-Cookie"] || [];
    var expires = new Date();
    expires.setSeconds(expires.getSeconds() + expiresInSeconds);

    var cookie = sessionCookie(sessionId, secret, expires, cookieKey);

    res = util.ensureSetCookieArray(res);
    res.headers["Set-Cookie"] = res.headers["Set-Cookie"].filter(isNotSessionIdCookie(cookieKey));
    res.headers["Set-Cookie"].push(cookie);

    return res;
}

function isNotSessionIdCookie(cookieKey) {
    return function (el) {
        return !(new RegExp("^" + cookieKey + "=").test(el));
    }
}

function sessionCookie(sessionId, secret, expires, cookieKey) {
    return format("%s=%s; Path=/; Expires=%s;",
        cookieKey,
        encodeSessionId(sessionId, secret),
        expires.toUTCString());
}

function encodeSessionId(sessionId, secret) {
    return encodeURIComponent(security.encrypt(sessionId, secret));
}
