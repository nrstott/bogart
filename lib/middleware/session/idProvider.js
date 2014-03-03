var uuid = require("node-uuid"),
    security = require("../../security"),
    util = require("../../util"),
    format = require('util').format,
    SESSION_ID_COOKIE = "bogart_session_id",
    DEFAULT_SESSION_LIFETIME = 1800;

exports.IdProvider = IdProvider;

function IdProvider(config) {
    config = config || {};
    config.encryptionKey = config.encryptionKey || "86812020-0755-11e1-b27f-000c290196f7";
    config.lifetime = config.lifetime || DEFAULT_SESSION_LIFETIME;

    this.config = config;
}

/**
 * Called once at the beginning of each request.
 */
IdProvider.prototype.getSessionId = function(req) {
    var cookie = util.parseCookies(req)[SESSION_ID_COOKIE];
    var id;
    if (!cookie) {
        id = uuid();
    } else {
        id = security.decrypt(decodeURIComponent(cookie), this.config.encryptionKey);
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
    return setCookie(req, res, sessionId, this.config.lifetime, this.config.encryptionKey);
};

IdProvider.prototype.destroy = function (req, res, sessionId) {
    return setCookie(req, res, sessionId, -1, this.config.encryptionKey);
};

function setCookie(req, res, sessionId, expiresInSeconds, encryptionKey) {
    res = res || {};
    res.headers = res.headers || {};
    res.headers["Set-Cookie"] = res.headers["Set-Cookie"] || [];
    var expires = new Date();
    expires.setSeconds(expires.getSeconds() + expiresInSeconds);

    var cookie = sessionCookie(sessionId, encryptionKey, expires);

    res = util.ensureSetCookieArray(res);
    res.headers["Set-Cookie"] = res.headers["Set-Cookie"].filter(isNotSessionIdCookie);
    res.headers["Set-Cookie"].push(cookie);

    return res;
}

function isNotSessionIdCookie(el) {
    return !(new RegExp("^" + SESSION_ID_COOKIE + "=").test(el));
}

function sessionCookie(sessionId, encryptionKey, expires) {
    return format("%s=%s; Path=/; Expires=%s;",
        SESSION_ID_COOKIE,
        encodeSessionId(sessionId, encryptionKey),
        expires.toUTCString());
}

function encodeSessionId(sessionId, encryptionKey) {
    return encodeURIComponent(security.encrypt(sessionId, encryptionKey));
}
