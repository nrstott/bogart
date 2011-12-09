var bogart = require('../lib/bogart')
  , util   = require('util')
  , Stream = require('stream').Stream;

function HelloWorldStream() {
  var self = this;

  Stream.call(this);

  this.readable = true;

  process.nextTick(function() {
    self.emit('data', 'Hello');
    process.nextTick(function() {
      self.emit('data', ' World');
      self.emit('end');
    });
  });
}

util.inherits(HelloWorldStream, Stream);

var router = bogart.router();
router.get('/', function() {
  return new HelloWorldStream();
});

var app = bogart.app();
app.use(bogart.middleware.bodyAdapter);
app.use(router);

app.start();