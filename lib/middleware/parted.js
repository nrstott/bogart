var middleware = require('../middleware')
  , q = require('../q')
  , ForEachStream = require('../forEachStream');

module.exports = function (nextApp, opts) {
  var parted = require('parted')
    , fn = parted(opts);

  return function(req) {
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

    fn(req, null, function() {
      q.when(nextApp(req), function(resp) {
        deferred.resolve(resp);
      }, deferred.reject);
    });

    return deferred.promise;
  };
};