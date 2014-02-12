var bogart = require('../lib/bogart')
  , util   = require('util')
  , stream = require('stream');

function HelloWorldStream() {
  var self = this;

  stream.Readable.call(this);

  var index = 0;

  var message = [
    '<html><head><meta charset="UTF-8"></head><body><p>This is an example ',
    'of a Bogart route that returns a ',
    'stream.</p>',
    '<p>To view a route that returns a buffer ',
    'go to <a href="/buffer">/buffer</a></p>',
    '</body>',
    '</html>'
  ];

  this._read = function () {
    if (index >= message.length) {
      this.push(null);
    } else {
      this.push(new Buffer(message[index++], 'ascii'));
    }
  };
}

util.inherits(HelloWorldStream, stream.Readable);

var router = bogart.router();
router.get('/', function() {
  return new HelloWorldStream();
});

router.get('/buffer', function() {
  return new Buffer('<html><head><meta charset="UTF-8"><title>Buffer</title></head>' +
    '<body>This is an example of a Bogart route that returns a buffer.</body></html>');
});

var app = bogart.app();
app.use(bogart.middleware.bodyAdapter);
app.use(router);

app.start();