var zlib = require('zlib')
  , bogart = require('../bogart')
  , middleware = require('../middleware')
  , q = require('../q');

function acceptsGzip(req) {
  var encodings;

  if (!req.headers || !req.headers['accept-encoding']) {
    return false;
  }

  encodings = req.headers['accept-encoding'].split(',');
  return encodings.filter(function(x) {
    return x === 'gzip';
  }).length > 0;
}

function toForEachable(stream) {
  var forEachable = {}
    , deferred = q.defer()
    , buffer = []
    , cb = null;

  forEachable.forEach = function(callback) {
    cb = callback;

    while (x = buffer.pop()) {
      cb(x);
    }

    return deferred.promise;
  };

  stream.on('data', function(data) {
  if (cb === null) { buffer.push(data); }
    else { cb(data); }
  });

  stream.on('end', function() {
    deferred.resolve();
  });

  return forEachable;
}

module.exports = middleware(function (req, nextApp) {
  var resp = nextApp(req);

  if (acceptsGzip(req)) {
    return q.when(resp, function(resp) {
      var gzip = zlib.createGzip();
      resp.headers['content-encoding'] = 'gzip';
      if (resp.headers['content-length']) {
        delete resp.headers['content-length'];
      }
      if (resp.headers['Content-Length']) {
        delete resp.headers['Content-Length'];
      }

      bogart.pump(resp.body, gzip);

      if(resp.status != 304) {
        resp.body = toForEachable(gzip);
      }
      return resp;
    });
  } else {
    return resp;
  }
});
