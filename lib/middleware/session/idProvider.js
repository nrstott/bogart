var uuid = require("node-uuid"),
    security = require("../../security"),
    util = require("../../util"),
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
    res = res || {};
    res.headers = res.headers || {};
    res.headers["Set-Cookie"] = res.headers["Set-Cookie"] || [];
    var expires = new Date();
    expires.setSeconds(expires.getSeconds() + this.config.lifetime);

    var cookie = SESSION_ID_COOKIE + "=" + encodeURIComponent(security.encrypt(sessionId, this.config.encryptionKey)) + "; Path=/; Expires=" + expires.toUTCString() + ";";

    res = util.ensureSetCookieArray(res);
    res.headers["Set-Cookie"] = res.headers["Set-Cookie"].filter(function(el) {
        return !(new RegExp("^" + SESSION_ID_COOKIE + "=").test(el));
    });
    res.headers["Set-Cookie"].push(cookie);

    return res;
};