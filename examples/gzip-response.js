var bogart = require('../lib/bogart');

var router = new bogart.router();
router.get('/', function() {
  return bogart.html('<h1>This response is compressed by the Deflate middleware!</h1>');
});

var Deflate = bogart.middleware.Deflate;


var app = Deflate(router);

bogart.start(app);