var q = require('../q')
  , middleware = require('../middleware');

module.exports = middleware(function (req, nextApp) {
  return q.when(nextApp(req), function (resp) {
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

    var searchFriendlyErrorCode = 'BODY_ADAPTER_BAD_RESPONSE_BODY';
    var reason = 'Middleware error: bodyAdapter found response body that does not have a forEach method, is not a Buffer, and is not a readable Stream.';

    throw new Error(reason + ' ' + searchFriendlyErrorCode);
  });
});
