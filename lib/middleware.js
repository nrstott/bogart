var
  Q    = require("promised-io/promise"), // npm
  when = Q.when,
  fs   = require("fs"), // node
  path = require("path"); // node

exports.ParseJson = function(nextApp) {
  return function(req) {
    var
      contentType = req.headers['content-type'];
    
    if (contentType && req.body) { 
      if (contentType === "application/json") {
        return when(req.body.join(), function(body) {
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
      if (contentType.indexOf(";")){
        contentType = contentType.split(";")[0];
      } 

      if (contentType === 'application/x-www-form-urlencoded' && req.body) {
        return when(req.body.join(), function(body) {
          req.body = require('querystring').parse(body);
            
          return nextApp(req);
        });
      }
    }
  
    return nextApp(req);  
  }
};

/**
 * Provides Rails-style HTTP method overriding via the _method parameter or X-HTTP-METHOD-OVERRIDE header
 * http://code.google.com/apis/gdata/docs/2.0/basics.html#UpdatingEntry
 */
exports.MethodOverride = function(nextApp) {
    return function(request) {
        if (request.body && typeof request.body == "object"){
        if ((request.method == "POST") && (!request.headers["content-type"].match(/^multipart\/form-data/))) {
                method = request.headers[HTTP_METHOD_OVERRIDE_HEADER] || request.POST(METHOD_OVERRIDE_PARAM_KEY);
            if (method && HTTP_METHODS[method.toUpperCase()] === true) {
                request.env.original_method = request.method;
                request.method = method.toUpperCase();
            }
        }
        }
        return nextApp(request);
    }
};

var HTTP_METHODS = exports.HTTP_METHODS = {"GET":true, "HEAD":true, "PUT":true, "POST":true, "DELETE":true, "OPTIONS":true};
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
    });
  };
};

function respondWithFile(req, filePath, contentType) {
  contentType = require("./mimetypes").mimeType(path.extname(filePath), contentType);
  
  return when(stat(filePath), function(stat) {
    var etag = [ stat.ino, stat.size, Date.parse(stat.mtime) ].join("-");
    
    if (req.headers && req.headers["if-none-match"] === etag) {
      return {
        "status": 304,
        "body": [ "Not Modified" ],
        "headers": { "content-length": "Not Modified".length }
      };
    }
    
    return when(readFile(filePath), function onSuccess(contents) {
      return {
        "status": 200,
        "headers": {
          "etag": etag,
          "content-type": contentType
        },
        "body": [ contents ]
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

//exports.serveStatic = require("pintura/jsgi/static").Static;
