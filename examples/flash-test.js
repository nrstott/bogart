var bogart = require('../lib/bogart');

var router = bogart.router();

router.get('/flash', function(req) {
  var existing = 'Existing Flash:'+req.flash('foo')+'<br />';

  req.flash('foo', Math.random() * 10);

  console.log('existing', existing);

  return bogart.html(existing);
});

//the following config options are optional, defaults are assumed
var flashConfig = {
  options: {
    dataProvider: {
      encryptionKey: 'db0031e2-04e7-11e1-86ad-000c290196f7'
    },
    idProvider: {}
  }
};

var app = bogart.app();
app.use(bogart.middleware.flash(flashConfig));
app.use(router);

app.start();