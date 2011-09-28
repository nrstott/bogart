var util   = require('util')
  , Stream = require('stream').Stream
  , Q      = require('promised-io/lib/promise');

function ForEachStream(forEachable) {
  if (!(this instanceof ForEachStream)) return new ForEachStream(forEachable);

  Stream.call(this);

  var self     = this
    , length   = 0
    , streamed = 0;

  this.fd = null;
  this.readable = true;
  this.writeable = false;
  this.paused = false;

  this.pause = function() {
    this.paused = true;
  };

  this.resume = function() {
    this.paused = false;
  };

  var emitData = function(data) {
    if (self.paused) {
      process.nextTick(function() { emitData(data); });
    } else {
      try {
        self.emit('data', data);
      } catch (err) {
        console.log('data err', err);
      }
      streamed += 1;
    }
  };

  var emitEnd = function() {
    if (streamed < length) {
      process.nextTick(emitEnd);
    } else {
      self.emit('end');
    }
  };

  process.nextTick(function() {
    var p = forEachable.forEach(function(data) {
      process.nextTick(function() { emitData(data); });
      length += 1;
    });

    Q.when(p, function() {
      emitEnd();
    });
  });
};

require('util').inherits(ForEachStream, Stream);

module.exports = ForEachStream;