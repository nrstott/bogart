var bogart = require('../lib/bogart');

var router = bogart.router();
router.get('/', function(req) {
  console.log('in router');
	return 'Hello Root';
});

router.get('/:name', function(req) {
	return 'Hello '+req.params.name;
});

var app = bogart.app();
app.use(bogart.batteries());
//app.use(bogart.middleware.stringReturnAdapter);
app.use(router);

app.start();