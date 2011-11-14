var bogart = require('../../lib/bogart')
  , util   = require('util');

var router = bogart.router();

router.get('/', function(req) {
  var html = '<!doctype html>' +
    '<title>multi</title>' +
    '<style>form > * { display: block; }</style>' +
    '<form action="/" method="POST" enctype="multipart/form-data">' +
    '  <input type="text" name="text" value="hello">' +
    '  <input type="file" name="content">' +
    '  <textarea name="hello">oh look the end of the part:\r\n--</textarea>' +
    '  <input type="submit" value="go">' +
    '</form>';
  
  return bogart.html(html);
});

router.post('/', function(req) {
  console.log(req.body);

  return bogart.text(util.inspect(req.body));
});

bogart.start(bogart.middleware.Parted(router));