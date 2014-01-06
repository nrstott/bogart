var bogart = require('../lib/bogart');

var app = bogart.app();

app.get('/', function (req) {
  return bogart.text('Hello Root');
});

app.get('/:name', function (req) {
  return bogart.text('Hello '+req.params.name);
});

app.start(1337);
