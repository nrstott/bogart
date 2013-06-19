var middleware = require('../middleware')
  , q = require('../q');

function defaultErrorResponse(err) {
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

/**
 * Translates rejected promises to a JSGI error response.
 *
 * @param errorResponse {Function}  Optional. A function that returns a JSGI response when passed an error.
 * @returns {Function} JSGI response.
 */
module.exports = function (app, errorResponse) {
  errorResponse = errorResponse || defaultErrorResponse;
  
  if (typeof errorResponse !== 'function') {
    throw new Error('`errorResponse` parameter must be a function');
  }

  return function (req) {
    return q.whenCall(function() { return app(req); }, function(val) { 
      return val;
    }, function(err) {
      return errorResponse(err);
    });
  };
};
