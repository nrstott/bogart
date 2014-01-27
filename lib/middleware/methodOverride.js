var middleware = require('../middleware');

var HTTP_METHODS = {
  "GET": true,
  "HEAD": true,
  "PUT": true,
  "POST": true,
  "DELETE": true,
  "OPTIONS": true
};

var METHOD_OVERRIDE_PARAM_KEY = "_method";
var HTTP_METHOD_OVERRIDE_HEADER = 'x-http-method-override';

/**
 * Provides Rails-style HTTP method overriding via the _method parameter or X-HTTP-METHOD-OVERRIDE header
 * http://code.google.com/apis/gdata/docs/2.0/basics.html#UpdatingEntry
 */
var methodOverride = middleware(function (req, nextApp) {

  if (req.body && typeof req.body == 'object') {

    if ((req.method.toUpperCase() == 'POST') && (req.headers['content-type'] && !req.headers['content-type'].match(/^multipart\/form-data/))) {
      var method = req.headers[HTTP_METHOD_OVERRIDE_HEADER] || req.body[METHOD_OVERRIDE_PARAM_KEY];

      if (method && HTTP_METHODS[method.toUpperCase()] === true) {
        req.env.original_method = req.method;
        req.method = method.toUpperCase();
      }
    }
  }
  return nextApp(req);
});

methodOverride.METHOD_OVERRIDE_PARAM_KEY = METHOD_OVERRIDE_PARAM_KEY;
methodOverride.HTTP_METHOD_OVERRIDE_HEADER = HTTP_METHOD_OVERRIDE_HEADER;

module.exports = methodOverride;
