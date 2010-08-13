var
  jsgi   = require('jsgi'),
  bogart = require('../../lib/bogart'),
  path   = require('path')

var app = bogart.app(function(show) {
  console.log(path.dirname(require.main.id));
  var viewEngine = bogart.viewEngine('mustache', path.join(bogart.maindir(), 'views'));

  show('/', function(req, res) {
    return viewEngine.respond('index.html', { locals: { description: 'This is content' } });
  });
});

jsgi.start(app);
