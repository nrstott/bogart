var Q             = require('promised-io/lib/promise')
  , Stream        = require('stream').Stream
  , util          = require('util')
  , ForEachStream = require('./forEachStream');


function pumpForEachStream(src, dest) {
  var deferred = Q.defer()
    , forEachStream = new ForEachStream(src)
    , isRejected = false;

  forEachStream.pipe(dest);

  forEachStream.on('end', function() {
    if (!isRejected) {
      deferred.resolve();
    }
  });

  forEachStream.on('error', function(err) {
    deferred.reject(err);
  });

  return deferred.promise;
}

function pumpStream(src, dest) {
  var deferred   = Q.defer()
    , isRejected = false;

  src.pipe(dest);

  src.on('end', function() {
    if (!isRejected) {
      deferred.resolve();
    }
  });

  src.on('error', function(err) {
    deferred.reject(err);
  });

  return deferred.promise;
}

/**
 * Pipes data from source to dest.
 *
 * @param {ForEachable | ReadableStream} src   Source of data
 * @param {WriteableStream}              dest  Write data from src to dest
 *
 * @returns {Promise}  A promise that will be resolved when the pumping is completed
 */
exports.pump = function(src, dest) {
  if (src.forEach) {
    return pumpForEachStream(src, dest);
  } else {
    return pumpStream(src, dest);
  }
};

exports.ForEachStream = require('./forEachStream');