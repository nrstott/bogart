var bogart = require('../lib/bogart');

var router = new bogart.router();
router.get('/', function() {
  return bogart.html('<h1>This response is compressed by the Deflate middleware!</h1>');
});

var Gzip = bogart.middleware.Gzip;
var app = Gzip(router);

bogart.start(app);