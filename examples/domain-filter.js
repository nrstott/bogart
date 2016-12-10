/*
	NOTE: for this example to work you must add a matching entry to your host file, or otherwise correctly configure a DNS entry.
		EG: 127.0.0.1    jdc0590.bogart.local
*/


var bogart = require('../lib/bogart');

var router = bogart.router();
router.get('/', function(req) {
	return 'Tenant: ' + req.env.domain.tenant;
});

var app = bogart.app();

app.use(bogart.middleware.domainFilter, ":tenant.bogart.local")
app.use(bogart.batteries);
app.use(router);

app.start();