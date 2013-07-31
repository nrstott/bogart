var util   = require('util')
  , Readable = require('stream').Readable
  , Q      = require('./q');

var enqueue = typeof setImmediate === 'function' ? setImmediate : process.nextTick;

function ForEachStream(forEachable) {
  if (!(this instanceof ForEachStream)) return new ForEachStream(forEachable);

  Readable.call(this);

  var self = this;

  this._waitingDeferred = null;
  this._readingDeferred = null;

  this._read = function () {
    if (this._waitingDeferred !== null) {
      this._waitingDeferred.resolve();
      this._waitingDeferred = null;
      return;
    }

    if (this._readingDeferred !== null) {
      return;
    }

    this._readingDeferred = Q.when(forEachable.forEach(function (data) {
      if (self.push(data) === false) {
        self._waitingDeferred = Q.defer();
        return self._waitingDeferred.promise;
      }
    }), function () {
      self.push(null);
    }, function (err) {
      self.emit('error', err);
    });
  };
};

require('util').inherits(ForEachStream, Readable);

module.exports = ForEachStream;
