var
  bogart = require('../../lib/bogart'),
  path   = require('path')

var app = bogart.router(function(show) {
  var viewEngine = bogart.viewEngine('jade');

  show('/', function(req) {
    return viewEngine.respond('index.jade', { locals: { description: 'This is content' } });
  });
});

bogart.start(app);
