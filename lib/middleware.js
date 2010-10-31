var
  Q    = require("promised-io/promise"),
  when = Q.when;

exports.parseJson = function(nextApp) {
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

exports.parseFormUrlEncoded = function(nextApp) {
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
//exports.serveStatic = require("pintura/jsgi/static").Static;
