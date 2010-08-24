var
  bogart = require('../../lib/bogart'),
  path   = require('path')

var app = bogart.router(function(show) {
  var viewEngine = bogart.viewEngine('mustache', path.join(bogart.maindir(), '..', 'views'));

  show('/', function(req, res) {
    return viewEngine.respond('index.html', { locals: { description: 'This is content' } });
  });
});

bogart.start(app);
