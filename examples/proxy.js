var bogart = require('../lib/bogart');

var router = bogart.router();
router.get('/', function() {
  return bogart.proxy('http://google.com');
});

var app = bogart.app();
app.use(router);

app.start();
