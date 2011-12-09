var bogart = require('../lib/bogart')
  , util   = require('util')
  , Stream = require('stream').Stream;

function HelloWorldStream() {
  var self = this;

  Stream.call(this);

  this.readable = true;

  process.nextTick(function() {
    self.emit('data', '<html><head><title>Stream</title><body>');
    process.nextTick(function() {
      self.emit('data', 
        'This is an example of a Bogart route that returns a stream. '+
        '<a href="/buffer">See a route that returns a Buffer</a></body></html>');
      self.emit('end');
    });
  });
}

util.inherits(HelloWorldStream, Stream);

var router = bogart.router();
router.get('/', function() {
  return new HelloWorldStream();
});

router.get('/buffer', function() {
  return new Buffer('<html><head><title>Buffer</title></head>' +
    '<body>This is an example of a Bogart route that returns a buffer.</body></html>');
});

var app = bogart.app();
app.use(bogart.middleware.bodyAdapter);
app.use(router);

app.start();