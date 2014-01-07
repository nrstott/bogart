var q = require('../q')
  , ForEachStream = require('../forEachStream')
  , parted = require('parted');

module.exports = function PartedMiddleware(opts) {
  return function partedMiddleware(req, next) {
    var fn = parted(opts)
      , deferred = q.defer()
      , oldBody = req.body
      , emitter;

    if (oldBody === undefined) {
      return next(req);
    }

    emitter = new ForEachStream(oldBody);
    req.on = emitter.on.bind(emitter);
    req.pipe = emitter.pipe.bind(emitter);

    delete req.body;

    fn(req, null, function () {
      q.when(next(), function (res) {
        deferred.resolve(res);
      }, deferred.reject);
    });

    return deferred.promise;
  };
};