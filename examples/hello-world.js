var bogart = require('../lib/bogart');

var app = bogart.router();

app.get('/', function(req) {
  return bogart.html('Hello World<br /><br /><a href="/hello/bogart">Hello Bogart</a>');
});

app.get('/hello/:name', function(req, name) {
  return bogart.html('Hello '+name);
});

bogart.start(app);
