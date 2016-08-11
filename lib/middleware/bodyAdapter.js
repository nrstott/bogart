var q = require('../q')
  , middleware = require('../middleware')
  , stream = require('stream');

module.exports = function (req, nextApp) {
  return q.when(nextApp(req), function (resp) {
    if (!resp) {
      return;
    }

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
      return require('../bogart').pipe(resp, { status: 200 });
    }

    if (typeof resp.body === 'string') {
      resp.body = [ resp.body ];
      return resp;
    }

    var searchFriendlyErrorCode = 'BODY_ADAPTER_BAD_RESPONSE_BODY';
    var reason = 'Middleware error: The response object returned by your route handler for "'+
      req.pathInfo+'" is not a proper bogart JSGI response.'+
      ' It does not have a forEach method, is not a Buffer, and is not a readable Stream';

    throw new Error(reason + ' ' + searchFriendlyErrorCode);
  });
};
