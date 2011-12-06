var bogart = require('../lib/bogart');

var router = bogart.router();
router.get('/', function() {
  return bogart.proxy('http://google.com');
});

bogart.start(router);
