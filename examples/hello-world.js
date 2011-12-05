var bogart = require('../lib/bogart');

var router = bogart.router();
router.get('/', function(req) {
	return 'Hello Root';
});

router.get('/:name', function(req) {
	return 'Hello '+req.params.name;
});

var app = bogart.app();
app.use(bogart.batteries);
app.use(router);

app.start();