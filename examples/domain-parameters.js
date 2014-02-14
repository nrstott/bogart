/*
	NOTE: for this example to work you must add a matching entry to your host file, or otherwise correctly configure a DNS entry.
		EG: 127.0.0.1    jdc0590.bogart.local
*/


var bogart = require('../lib/bogart');
var app = bogart.app();

app.use(bogart.middleware.domainParameters(':tenant.bogart.local'));

var router = app.router();
router.get('/', function(req) {	
	return bogart.text('Tenant: ' + req.body.tenant);
});

app.start();