var bogart = require('../../lib/bogart');

var viewEngine = bogart.viewEngine('mustache');

viewEngine.share(new Date(), 'now');

viewEngine.share({
	app: 'JavaScript Sharing Example',
	framework: 'Bogart',
	author: 'Nathan Stott'
}, 'settings');

viewEngine.share(function() {
	return 'Shared on the server, executed on the client';
}, 'fn');

var router = bogart.router()
router.get('/', function(req) {
  return viewEngine.respond('index.html', { locals: { title: 'Hello World' }, layout: false });
});

var app = bogart.app();
app.use(router);
app.start();
