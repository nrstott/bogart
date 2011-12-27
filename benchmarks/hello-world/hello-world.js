var bogart = require('../../lib/bogart');

var router = bogart.router();
router.get('/', function(req) {
  return bogart.html('Hello World');
});

bogart.start(router);
