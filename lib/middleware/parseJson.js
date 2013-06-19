var middleware = require('../middleware')
  , forEachable = require('../forEachable')
  , q = require('../q');

module.exports = middleware(function (req, nextApp) {
  var contentType = req.headers['content-type'];

  if (contentType && req.body) {
    if (contentType === 'application/json') {

      return q.when(forEachable.join(req.body), function success(body) {
        req.body = JSON.parse(body);

        return nextApp(req);
      });
    }
  }

  return nextApp(req);
});