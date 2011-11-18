var Q = require('promised-io/lib/promise'),
    when = Q.when,
    fs = require('fs'),
    path = require('path'),
    ForEachStream = require('./forEachStream'),
    util = require('./util'),
    EventEmitter = require('events').EventEmitter,
    Proxy = require('node-proxy'),
    _ = require('underscore');

function join(forEachable) {
    var body = '',
        appendChunk;

    appendChunk = function(chunk) {
        body += chunk;
    };

    return when(forEachable.forEach(appendChunk), function success() {
        return body;
    });
}

exports.ParseJson = function(nextApp) {
    return function(req) {
        var contentType = req.headers['content-type'];

        if (contentType && req.body) {
            if (contentType === "application/json") {

                return when(join(req.body), function success(body) {
                    req.body = JSON.parse(body);

                    return nextApp(req);
                });
            }
        }

        return nextApp(req);
    }
};

exports.ParseForm = function(nextApp) {
    return function(req) {
        var contentType = req.headers['content-type'];

        if (contentType) {
            if (contentType.indexOf(";")) {
                contentType = contentType.split(";")[0];
            }

            if (contentType === 'application/x-www-form-urlencoded' && req.body) {

                return when(join(req.body), function(body) {
                    req.body = require('querystring').parse(body);

                    return nextApp(req);
                });
            }
        }

        return nextApp(req);
    }
};

exports.Gzip = function(nextApp) {
    var deflate = require('deflate'),
        bogart = require('./bogart');

    function acceptsGzip(req) {
        var encodings;

        if (!req.headers || !req.headers['accept-encoding']) {
            return false;
        }

        encodings = req.headers['accept-encoding'].split(',');
        return encodings.filter(function(x) {
            return x === 'gzip';
        }).length > 0;
    }

    return function(req) {
        var resp = nextApp(req);

        if (acceptsGzip(req)) {
            return Q.when(resp, function(resp) {
                var ds = deflate.createDeflateStream(new ForEachStream(resp.body.map(function(chunk) {
                    return new Buffer(chunk);
                })));
                ds.readStream.pipe(ds);

                resp.headers['content-encoding'] = 'gzip';

                return bogart.pipe(ds, resp);
            });
        } else {
            return resp;
        }
    };
};

/**
 * Provides Rails-style HTTP method overriding via the _method parameter or X-HTTP-METHOD-OVERRIDE header
 * http://code.google.com/apis/gdata/docs/2.0/basics.html#UpdatingEntry
 */
exports.MethodOverride = function(nextApp) {
    return function(request) {
        if (request.body && typeof request.body == "object") {
            if ((request.method == "POST") && (!request.headers["content-type"].match(/^multipart\/form-data/))) {
                method = request.headers[HTTP_METHOD_OVERRIDE_HEADER] || request.body[METHOD_OVERRIDE_PARAM_KEY];
                if (method && HTTP_METHODS[method.toUpperCase()] === true) {
                    request.env.original_method = request.method;
                    request.method = method.toUpperCase();
                }
            }
        }
        return nextApp(request);
    }
};

exports.Parted = function(nextApp, opts) {
    var parted = require('parted'),
        fn = parted(opts);

    return function(req) {
        var deferred = Q.defer(),
            oldBody = req.body,
            emitter;

        if (oldBody === undefined) {
            return nextApp(req);
        }

        emitter = new ForEachStream(oldBody);
        req.on = emitter.on.bind(emitter);
        req.pipe = emitter.pipe.bind(emitter);

        delete req.body;

        fn(req, null, function() {
            Q.when(nextApp(req), function(resp) {
                deferred.resolve(resp);
            });
        });

        return deferred.promise;
    };
};

/**
 * Translates rejected promises to a JSGI error response.
 *
 * @param errorResponse {Function}  A function that returns a JSGI response when passed an error.
 */
exports.Error = function(app, errorResponse) {
    errorResponse = errorResponse ||
    function(err) {
        return {
            status: 500,
            body: ['<html><head><title>Error</title></head><body>An error occurred.', err.message ? err.message : '', '<br /><br />', err.stack ? err.stack : '', '</body>'],
            headers: {
                'content-type': 'text/html'
            }
        };
    };

    if (typeof errorResponse !== 'function') {
        throw new Error('`errorResponse` parameter must be a function');
    }

    return function(req) {
        try {
            return Q.when(app(req), null, function(err) {
                return errorResponse(err);
            });
        } catch (err) {
            return errorResponse(err);
        }
    };
};

var HTTP_METHODS = exports.HTTP_METHODS = {
    "GET": true,
    "HEAD": true,
    "PUT": true,
    "POST": true,
    "DELETE": true,
    "OPTIONS": true
};
var METHOD_OVERRIDE_PARAM_KEY = exports.METHOD_OVERRIDE_PARAM_KEY = "_method";
var HTTP_METHOD_OVERRIDE_HEADER = exports.HTTP_METHOD_OVERRIDE_HEADER = "x-http-method-override";

exports.Directory = function(root, nextApp) {
    return function(req) {
        var reqPath = path.join(root, req.pathInfo.substring(1));

        return when(stat(reqPath), function(stat) {
            if (!stat) {
                return nextApp(req);
            } else if (stat.isFile()) {
                return respondWithFile(req, reqPath);
            } else {
                return nextApp(req);
            }
        }, function(err) {
            return nextApp ? nextApp(req) : {
                "status": 404,
                "body": ["404 Not Found"],
                "headers": {
                    "content-length": 13
                }
            };
        });
    };
};

var respondWithFile = exports.respondWithFile = function(req, filePath, contentType) {
        contentType = require("./mimetypes").mimeType(path.extname(filePath), contentType);

        return when(stat(filePath), function(stat) {
            var etag = [stat.ino, stat.size, Date.parse(stat.mtime)].join("-");

            if (req.headers && req.headers["if-none-match"] === etag) {
                return {
                    "status": 304,
                    "body": [],
                    "headers": {
                        "content-length": "Not Modified".length
                    }
                };
            }

            return when(readFile(filePath), function onSuccess(contents) {
                return {
                    "status": 200,
                    "headers": {
                        "etag": etag,
                        "content-type": contentType
                    },
                    "body": [contents]
                }
            });
        });
    }

function readFile(filePath) {
    var deferred = Q.defer();

    fs.readFile(filePath, function(err, data) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(data);
        }
    });

    return deferred.promise;
}

function stat(fileOrFolderPath) {
    var deferred = Q.defer();

    fs.stat(fileOrFolderPath, function(err, status) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(status);
        }
    });

    return deferred.promise;
}

exports.Flash = function(config, nextApp) {
    config = config || {};
    config.options = config.options || {};

    config.flashIdProvider = config.flashIdProvider || new(require("./flash/flashIdCookieProvider"))(config.options.idProvider || {});
    config.flashDataProvider = config.flashDataProvider || new(require("./flash/flashCookieDataProvider"))(config.options.dataProvider || {});

    return function(req) {
        if (req.pathInfo === "/favicon.ico") {
            return nextApp(req);
        }
        var oldFlashId = config.flashIdProvider.getFlashId(req);

        // get a new id for the current request
        var newFlashId = config.flashIdProvider.newId(req);

        // make flash data from previous request available
        req.env = req.env || {};
        var prevData = oldFlashId ? config.flashDataProvider.previousFlash(req, oldFlashId) : {};


        return when(prevData, function(data) {
            req.env.flash = data || {};
            // create the setter for new flash data
            var setter = config.flashDataProvider.setter(req, newFlashId);
            req.flash = function(key, val) {
                if (key && val) {
                    var obj = {};
                    obj[key] = val;
                    setter(obj);
                } else return req.env.flash[key];
            }

            return when(nextApp(req), function(resp) {
                if (oldFlashId) {
                    // clear old flash data
                    resp = config.flashDataProvider.clear(req, resp, oldFlashId);
                    // clear old flash id
                    resp = config.flashIdProvider.clear(req, resp, oldFlashId);
                }

                // finalize the flashId provider for the current request
                resp = config.flashIdProvider.finalize(req, resp, newFlashId);
                // finalize the flash data provider for the current request
                resp = config.flashDataProvider.finalize(req, resp, newFlashId);

                return resp;
            });
        });
    };
};


/**
 * Creates a OAuth2 section to auth routes requiring oauth2
 *
 */
exports.oauth2 = function(config, nextApp) {
    var options = {
        authorizationURL: 'https://www.facebook.com/dialog/oauth',
        tokenURL: 'https://graph.facebook.com/oauth/access_token',
        resourceURL: 'https://graph.facebook.com/me',
        redirectURL: '/'
    };
    options = _.extend(options, config);

    var OAuth2 = new(require('oauth').OAuth2)(options.clientId, options.clientSecret, '', options.authorizationURL, options.tokenURL),
        bogart = require('./bogart');
    var authd = function(req) {
            if (!req.session('profile')) {
                return bogart.redirect('/facebookLogin');
            }
            return nextApp(req);
        };
    var router = bogart.router(null, authd);
    var redirectUri = function(req) {
            return req.scheme + '://' + req.host + (!(req.port === 80 || req.port === 443) ? ':' + req.port : '') + '/facebookCallback'
        };

    router.get('/facebookLogin', function(req) {

        var url = OAuth2.getAuthorizeUrl({
            response_type: 'code',
            redirect_uri: redirectUri(req)
        });

        return bogart.redirect(url);
    });

    router.get('/facebookLogout', function(req) {
        req.session('profile', undefined);

        return bogart.redirect('/');
    });

    router.get('/facebookCallback', function(req) {
        var queryString = require('querystring').parse(req.queryString);

        var deffered = Q.defer();

        if (queryString && queryString.code) {
            var code = queryString.code;

            // NOTE: The module oauth (0.9.5), which is a dependency, automatically adds
            //       a 'type=web_server' parameter to the percent-encoded data sent in
            //       the body of the access token request.  This appears to be an
            //       artifact from an earlier draft of OAuth 2.0 (draft 22, as of the
            //       time of this writing).  This parameter is not necessary, but its
            //       presence does not appear to cause any issues.
            OAuth2.getOAuthAccessToken(code, {
                grant_type: 'authorization_code',
                redirect_uri: redirectUri(req)
            }, function(err, accessToken, refreshToken) {
                OAuth2.getProtectedResource(options.resourceURL, accessToken, function(err, body, res) {
                    try {
                        var profile = options.parse(body)
                        if (err) {
                            deffered.reject(err);
                        }

                        req.session('profile', profile);

                        deffered.resolve(bogart.redirect(options.redirectURL || '/'));
                    } catch (e) {
                        deffered.reject(e);
                    }
                });
            });
        }

        return deffered.promise;
    });

    return router;
}

exports.facebook = function(config,nextApp) {
    var facebook_strategy = {
        authorizationURL: 'https://www.facebook.com/dialog/oauth',
        tokenURL: 'https://graph.facebook.com/oauth/access_token',
        resourceURL: 'https://graph.facebook.com/me',
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        redirectURL: '/profile',
        parse: function(body) {
            o = JSON.parse(body);

            var profile = {
                provider: 'facebook'
            };
            profile.id = o.id;
            profile.username = o.username;
            profile.displayName = o.name;
            profile.name = {
                familyName: o.last_name,
                givenName: o.first_name,
                middleName: o.middle_name
            };
            profile.gender = o.gender;
            profile.profileUrl = o.link;
            profile.emails = [{
                value: o.email
            }];

            return profile;
        }
    };

    return exports.oauth2(facebook_strategy, nextApp);
}

/* Passport wrapper for bogart
 *
 * Typical usage:
 *  app = bpassport(app);
 *  app = bogart.middleware.Session(null,app);
 *
 */

function bpassport(nextApp) {
    return function(req) {
        if (!req.session) throw new Error('Bogart session middleware must come before Bpassport in the chain');

        var session = req.session;

        var deferred = q.defer();

        req.session = Proxy.create({
            get: function(rec, name) {
                return session(name);
            },
            set: function(rec, name, val) {
                session(name, val);
            }
        });

        req.env = req.env || {};
        req.env.res = bogart.response();

        req.__proto__ = http.IncomingMessage.prototype;
        req.query = querystring.parse(req.queryString);

        req.login = req.logIn = function(user, options, done) {
            if (!done && typeof options === 'function') {
                done = options;
                options = {};
            }

            req.session("user", user);

            done();
        };

        req.logout = req.logOut = function() {
            req.session("user", undefined);
        }

        passport.initialize()(req, req.env.res, function() {
            req.session = session;
            q.when(nextApp(req), function(res) {
                deferred.resolve(res);
            });
        });

        return deferred.promise;
    }
}

exports.Session = require("./session/session").Session;