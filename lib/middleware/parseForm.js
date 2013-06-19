var q = require('../q')
  , forEachable = require('../forEachable')
  , querystring = require('querystring');

module.exports = function (nextApp) {
  return function(req) {
    var contentType = req.headers['content-type'];

    if (contentType) {
      if (contentType.indexOf(";")) {
        contentType = contentType.split(";")[0];
      }

      if (contentType === 'application/x-www-form-urlencoded' && req.body) {

        return q.when(forEachable.join(req.body), function (body) {
          req.body = querystring.parse(body);

          return nextApp(req);
        });
      }
    }

    return nextApp(req);
  }
};
