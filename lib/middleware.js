var Q = require('promised-io/lib/promise'),
    when = Q.when,
    fs = require('fs'),
    path = require('path'),
    ForEachStream = require('./forEachStream'),
    util = require('./util');

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

exports.Flash = function(options, nextApp) {
    options.flashIdProvider = options.flashIdProvider || require("./flashIdCookieProvider");
    options.flashDataProvider = options.flashDataProvider || require("./flashCookieDataProvider");

    return function(req) {
        if(req.pathInfo === "/favicon.ico") {
            return nextApp(req);
        }
        var oldFlashId = options.flashIdProvider.getFlashId(req);

        // get a new id for the current request
        var newFlashId = options.flashIdProvider.newId(req);

        // create the setter for new flash data
        req.flash = options.flashDataProvider.setter(req, newFlashId);

        // make flash data from previous request available
        req.env = req.env || {};
        req.env.flash = oldFlashId ? options.flashDataProvider.previousFlash(req, oldFlashId) : {};

        return when(nextApp(req), function(resp) {
            if (oldFlashId) {
                // clear old flash data
                resp = options.flashDataProvider.clear(req, resp, oldFlashId);
                // clear old flash id
                resp = options.flashIdProvider.clear(req, resp, oldFlashId);
            }

            // finalize the flashId provider for the current request
            resp = options.flashIdProvider.finalize(req, resp, newFlashId);
            // finalize the flash data provider for the current request
            resp = options.flashDataProvider.finalize(req, resp, newFlashId);

            return resp;
        });
    };
};