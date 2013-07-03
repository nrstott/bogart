var q = require('../q')
  , ForEachStream = require('../forEachStream')
  , parted = require('parted');

module.exports = function partedMiddleware(opts, nextApp) {
  if (nextApp === undefined) {
    if (typeof opts === 'function') {
      nextApp = opts;
      opts = undefined;
    } else {
      return function (nextApp) {
        return partedMiddleware(opts, nextApp);
      };
    }
  }
  
  var fn = parted(opts);

  return function (req) {
    var deferred = q.defer()
      , oldBody = req.body
      , emitter;

    if (oldBody === undefined) {
      return nextApp(req);
    }

    emitter = new ForEachStream(oldBody);
    req.on = emitter.on.bind(emitter);
    req.pipe = emitter.pipe.bind(emitter);

    delete req.body;

    fn(req, null, function () {
      q.when(nextApp(req), function (resp) {
        deferred.resolve(resp);
      }, deferred.reject);
    });

    return deferred.promise;
  };
};