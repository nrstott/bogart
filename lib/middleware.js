var Q = require('promised-io/lib/promise'),
    when = Q.when,
    fs = require('fs'),
    path = require('path'),
    ForEachStream = require('./forEachStream'),
    util = require('./util'),
    merge = util.merge,
    EventEmitter = require('events').EventEmitter,
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

exports.parseJson = exports.ParseJson = function(nextApp) {
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

exports.parseForm = exports.ParseForm = function(nextApp) {
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

exports.gzip = exports.Gzip = function(nextApp) {
    var zlib = require('zlib'),
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
                var gzip = zlib.createGzip();
                resp.headers['content-encoding'] = 'gzip';
                if (resp.headers['content-length']) {
                  delete resp.headers['content-length'];
                }

                bogart.pump(resp.body, gzip);

                resp.body = toForEachable(gzip);
                return resp;
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
exports.methodOverride = exports.MethodOverride = function(nextApp) {
    return function(request) {
        if (request.body && typeof request.body == "object") {
            if ((request.method == "POST") && (!request.headers["content-type"].match(/^multipart\/form-data/))) {
                var method = request.headers[HTTP_METHOD_OVERRIDE_HEADER] || request.body[METHOD_OVERRIDE_PARAM_KEY];
                if (method && HTTP_METHODS[method.toUpperCase()] === true) {
                    request.env.original_method = request.method;
                    request.method = method.toUpperCase();
                }
            }
        }
        return nextApp(request);
    }
};

exports.parted = exports.Parted = function(nextApp, opts) {
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
            }, deferred.reject);
        });

        return deferred.promise;
    };
};

/**
 * Translates rejected promises to a JSGI error response.
 *
 * @param errorResponse {Function}  Optional. A function that returns a JSGI response when passed an error.
 * @returns {Function} JSGI response.
 */
exports.error = exports.Error = function(app, errorResponse) {
    errorResponse = errorResponse ||
    function(err) {
        var message;

        if (typeof err === 'string') {
          message = err;
        } else if (err.message) {
          message = err.message;
          if (err.stack) {
            message += '<br /><br />Stack Trace:<br />'+err.stack;
          }
        }

        return {
            status: 500,
            body: ['<html><head><title>Error</title></head><body>An error occurred.', message, '</body>'],
            headers: {
                'content-type': 'text/html'
            }
        };
    };

    if (typeof errorResponse !== 'function') {
        throw new Error('`errorResponse` parameter must be a function');
    }

    return function(req) {
      return Q.whenCall(function() { return app(req); }, function(val) { 
        return val;
      }, function(err) {
        return errorResponse(err);
      });
    };
};

/**
 * Validates that the response from nextApp is a valid JSGI response.
 * Rejects the promise if the response is invalid.
 *
 * @param {Function} nextApp  The next application in the JSGI chain.
 * @returns {Function} JSGI response.
 */
exports.validateResponse = exports.ValidateResponse = function(nextApp) {
  return function(req) {
    return Q.whenCall(function() { return nextApp(req); }, function(resp) {
      function reject(msg) {
        var defer = Q.defer();

        defer.reject(msg);

        return defer.promise;
      }

      if (!resp) {
        return reject('Response must be an object.');
      }

      if (!resp.body) {
        return reject('Response must have a body property.');
      }

      if (!resp.body.forEach) {
        return reject('Response body must have a forEach method.');
      }

      if (typeof resp.body.forEach !== 'function') {
        return reject('Response body has a forEach method but the forEach method is not a function.');
      }

      if (!resp.status) {
        return reject('Response must have a status property.');
      }

      if (typeof resp.status.constructor !== '[Function: Number]') {
        return reject('Response has a status property but the status property must be a number.');
      }

      return resp;
    }, function(err) {
      // Workaround for fact that whenCall calls rejectCallback even if one is not provided.
      throw err;
    });
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

exports.directory = exports.Directory = function(root, nextApp) {
    var opts;

    if (typeof root === 'string') {
        opts = { root: root };
    } else if (typeof root === 'object') {
        opts = root;
    } else {
        opts = {};
    }

    opts.headers = opts.headers || {};

    return function(req) {
        var reqPath = path.join(opts.root, req.pathInfo.substring(1));

        return when(stat(reqPath), function(stat) {
            if (!stat) {
                return nextApp(req);
            } else if (stat.isFile()) {
                return respondWithFile(req, reqPath, opts.headers);
            } else {
                return nextApp(req);
            }
        }, function(err) {
            var notFoundMessage = "404 Not Found";

            return nextApp ? nextApp(req) : {
                "status": 404,
                "body": [ notFoundMessage ],
                "headers": {
                    "content-length": Buffer.byteLength(notFoundMessage)
                }
            };
        });
    };
};

var respondWithFile = exports.respondWithFile = function(req, filePath, contentType, headers) {
    headers = headers || {};

    if (typeof contentType === 'object') {
        headers = contentType;
        contentType = undefined;
    }
    
    contentType = require("./mimetypes").mimeType(path.extname(filePath), contentType);

    return when(stat(filePath), function(stat) {
        var etag = [stat.ino, stat.size, Date.parse(stat.mtime)].join("-");

        if (req.headers && req.headers["if-none-match"] === etag) {
            return {
                status: 304,
                body: [],
                headers: {}
            };
        }

        return when(readFile(filePath), function onSuccess(contents) {
            return {
                "status": 200,
                "headers": merge({
                    "etag": etag,
                    "content-type": contentType
                }, headers),
                "body": [contents]
            }
        });
    });
};

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

exports.flash = exports.Flash = function(config, nextApp) {
    if (nextApp === undefined) {
        nextApp = config;
        config = {};
    }

    if (typeof nextApp !== 'function') {
        throw {
            message: 'flash middleware expects a nextApp as the last argument.',
            code: 'BOGART_FLASH_BAD_NEXTAPP'
        };
    }

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
        loginRoute: '/auth/login',
        logoutRoute: '/auth/logout',
        callbackRoute: '/auth/callback',
        modalAuthRoute: '/auth/modalauth'
    };
    options = _.extend(options, config);
    if (!options.host){
        throw new Error("host is a required option")
    }
    if (!options.host.match(/^http/)){
        throw new Error("host must include the protocal.");
    }    
    options.host = options.host.replace(/\/$/, ""); //remove trailing slash
       
    var OAuth2 = new(require('oauth').OAuth2)(options.clientId, options.clientSecret, '', options.authorizationURL, options.tokenURL),
        bogart = require('./bogart');
    var authd = function(req) {
            if (!req.session('profile')) {

                return bogart.redirect(options.loginRoute + '?returnUrl=' + req.pathInfo );
            }
            req.auth = req.auth || {};
            req.auth.profile = req.session('profile');
            req.auth.access_token = req.session('access_token');
            return nextApp(req);
        };
    var router = bogart.router(null, authd);
    var callbackRoute = "" 
    router.get(options.loginRoute, function(req) {
        callbackRoute = options.host + options.callbackRoute + '?returnUrl=' + encodeURIComponent(req.params.returnUrl);
        var url = OAuth2.getAuthorizeUrl({
            response_type: 'code',
            redirect_uri: callbackRoute
        });

        return bogart.redirect(url);
    });

    router.get(options.logoutRoute, function(req) {
        req.session('profile', undefined);

        return bogart.redirect('/');
    });

    router.get(options.callbackRoute, function(req) {
        var deffered = Q.defer();

        if (req.params.code) {
            var code = req.params.code;
            // NOTE: The module oauth (0.9.5), which is a dependency, automatically adds
            //       a 'type=web_server' parameter to the percent-encoded data sent in
            //       the body of the access token request.  This appears to be an
            //       artifact from an earlier draft of OAuth 2.0 (draft 22, as of the
            //       time of this writing).  This parameter is not necessary, but its
            //       presence does not appear to cause any issues.
            OAuth2.getOAuthAccessToken(code, {
                grant_type: 'authorization_code',
                redirect_uri: callbackRoute
            }, function(err, accessToken, refreshToken) {
                OAuth2.getProtectedResource(options.resourceURL, accessToken, function(err, body, res) {
                    try {
                        var profile = options.parse(body)
                        if (err) {

                        console.log(err)
                            deffered.reject(err);
                        }

                        req.session('profile', profile);
                        req.session('access_token', accessToken);

                        deffered.resolve(bogart.redirect(req.params.returnUrl || "/"));
                    } catch (e) {
                        deffered.reject(e);
                    }
                });
            });
        }

        return deffered.promise;
    });

    router.post(options.modalAuthRoute, function(req) {
        var deffered = Q.defer();
        var accessToken = req.params.accessToken;
        OAuth2.getProtectedResource(options.resourceURL, accessToken, function(err, body, res) {
            try {
                var profile = options.parse(body)
                if (err) {

                console.log(err)
                    deffered.reject(err);
                }

                req.session('profile', profile);
                req.session('access_token', accessToken);

                deffered.resolve(bogart.redirect(req.params.returnUrl || "/"));
            } catch (e) {                
                deffered.reject(e);
            }
        });

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
        host: config.host,
        parse: function(body) {
            if (body){
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
           return undefined;
        }
    };

    return exports.oauth2(facebook_strategy, nextApp);
}

exports.session = exports.Session = require("./session/session").Session;

/**
 * Adapts Node.JS Buffer and Stream types used as response bodies into
 * a CommonJS ForEachable.
 *
 * @param {Function} nextApp  The next application in the JSGI chain.
 * @returns {Function} JSGI Application.
 */
exports.bodyAdapter = function(nextApp) {
    return function(req) {
        return when(nextApp(req), function(resp) {
            if (resp.body && resp.body.forEach) {
                return resp;
            }

            if (Buffer.isBuffer(resp)) {
              return {
                status: 200,
                headers: { 'content-type': 'text/html' },
                body: [ resp.toString('utf-8') ]
              };
            }

            if (Buffer.isBuffer(resp.body)) {
                resp.body = [ resp.body.toString('utf-8') ];
                return resp;
            }

            if (resp.readable) {
                // Readable Node.JS style stream
                return {
                  status: 200,
                  headers: { 'content-type': 'text/html' },
                  body: toForEachable(resp)
                };
            }

            if (resp.body && resp.body.readable) {
                // Readable Node.JS style stream
                resp.body = toForEachable(resp.body);
                return resp;
            }

            throw { 
                message: 'Middleware error: bodyAdapter found response body that does not have a forEach method, is not a Buffer, and is not a readable Stream.',
                code: 'BODY_ADAPTER_BAD_RESPONSE_BODY'
            };
        });
    }
};

function toForEachable(stream) {
  var forEachable = {}
    , deferred = Q.defer()
    , buffer = []
    , cb = null;

  forEachable.forEach = function(callback) {
    cb = callback;

    while (x = buffer.pop()) {
      cb(x);
    }

    return deferred.promise;
  };

  stream.on('data', function(data) {
    if (cb === null) { buffer.push(data); }
    else { cb(data); }
  });

  stream.on('end', function() {
    deferred.resolve();
  });

  return forEachable;
}

/**
 * Translates strings into JSGI response objects.
 *
 * The default response has a status of 200 and a "Content-Type" header of "text/html"
 *
 * @param {Object} responseDefaults  Optional parameter. If stringReturnAdapter is called with one argument, that argument is assumed to be nextApp, not responseDefaults.
 * @param {Function} nextApp Next application in the JSGI chain.
 *
 * @returns {Function} JSGI Application.
 */
exports.stringReturnAdapter = function(responseDefaults, nextApp) {
    if (nextApp === undefined) {
        nextApp = responseDefaults;
        responseDefaults = {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        };
    }

    return function(req) {
        return when(nextApp(req), function(resp) {
            if (typeof resp === 'string') {
                return merge({}, responseDefaults, { body: [ resp ] });
            }

            return resp;
        });
    };
};

exports.binary = function(conditional, appTrue, appFalse) {
    return function(req) {
        return when(conditional, function(conditional) {
            if (typeof conditional === 'function') {
                conditional = conditional(req);
            }

            return conditional ? appTrue(req) : appFalse(req);
        });
    }
};

/**
 * JSGI Middleware that tries a series of JSGI Applications in order until one succeeds the `accept` test.
 * The first parameter is expected to be a function that will be called with the values returned by the applications.
 * The `accept` function must return a boolean indicating whether this response is the one that should be returned or
 * the next application in the series should be called.
 *
 *    var cascade = bogart.middleware.cascade(function(res) { return res.status !== 404 }, 
 *                      function(req) {
 *                          return {
 *                              status: 404,
 *                              headers: {}
 *                              body: []
 *                          };
 *                      }, function(req) {
 *                         return {
 *                             status: 200,
 *                             headers: { 'Content-Type': 'text/html' },
 *                             body: [ 'Hello World' ]
 *                         };
 *                      });
 *    cascade(req); // The 2nd middleware function's return would be accepted and would become the return from cascade.
 *
 * @params {Function} accept  A function `function(res) {}` that takes a response and returns a boolean.
 * @params {Function} apps  The rest of the arguments are used as applications to cascade through.
 *
 * @returns {Promise} JSGI Response
 */
exports.cascade = function(accept /*, apps */) {
    var args = Array.prototype.slice.call(arguments)
      , apps = [];

    accept = args.shift();

    args.forEach(function(x) {
        apps.push(x);
    });

    return function(req) {
        var deferred = Q.defer();

        function next(apps) {
            var nextAction = apps.shift();

            if (nextAction) {
                Q.whenCall(function() { return nextAction(req); }, function(resp) {
                    if (accept(resp)) {
                        return deferred.resolve(resp);
                    } else {
                        return next(apps);
                    }
                }, deferred.reject);
            } else {
                deferred.reject('No suitable Response found by cascade.');
            }
        }

        next(apps.concat());

        return deferred.promise;
    };
};

/**
 * All the goodies in one convenient middleware.
 *
 * Includes the following JSGI Chain:
 *
 * error -> validateResponse -> gzip -> directory -> parted -> methodOverride 
 *       -> session -> flash -> bodyAdapter -> stringReturnAdapter -> nextApp
 *
 * @param {Object} config   Optional configuration, if arity is two first parameter is config.
 * @param {Function} nextApp  The next application (Middleware, Bogart Router, etc...) in the JSGI chain.
 * @returns {Function} A good default middleware stack in one function call.
 */
exports.batteries = function(config, nextApp) {
    var root = 'public';

    if (nextApp === undefined) {
        nextApp = config;
    }

    if (!nextApp) {
        throw 'Bogart batteries requires at least one parameter, a nextApp to execute to fulfill the request.'
    }

    var stack = exports.Error(
      exports.gzip(
        exports.directory(root,
            exports.Parted(
                exports.MethodOverride(
                    exports.Session( 
                        exports.Flash(
                            exports.bodyAdapter(
                                exports.stringReturnAdapter(nextApp)))))))));

    return stack;
};
