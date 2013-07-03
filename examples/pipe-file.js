var bogart = require('../lib/bogart');
var fs     = require('fs');
var path   = require('path');

var router = bogart.router();

router.get('/', function(req) {
  return bogart.html('<html><body><img src="/image.jpg" /></body></html>');
});

router.get('/image.jpg', function(req) {
  var filePath = path.join(__dirname, 'static-server', 'public', 'images', 'ninja-cat.jpg')
    ,  stat     = fs.statSync(filePath);

  return bogart.pipe(fs.createReadStream(filePath), {
    headers: { 'Content-Type': 'image/jpeg', 'Content-Length': stat.size }
  });
});

router.get('/cat.jpg', function(req) {
	var filePath = path.join(__dirname, 'static-server', 'public', 'images', 'ninja-cat.jpg');
  
  return bogart.file(filePath);
});

var app = bogart.app();
app.use(router);

app.start();
