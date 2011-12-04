var bogart = require('../../lib/bogart');

var router = bogart.router()
  , viewEngine = bogart.viewEngine('mustache');

viewEngine.share(new Date(), 'now');

router.get('/', function(req) {
  return viewEngine.respond('index.html', { locals: { title: 'Hello World' }, layout: false });
});

bogart.start(router);