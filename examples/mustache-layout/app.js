var bogart = require('../../lib/bogart')
  , path   = require('path');

var viewEngine = bogart.viewEngine('mustache', path.join(bogart.maindir(), 'views'));

var router = bogart.router();

router.get('/', function(req, res) {
  return viewEngine.respond('index.html', { locals: { description: 'This is content' } });
});

bogart.start(router);
