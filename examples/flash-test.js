var bogart = require('../lib/bogart');

var flashConfig = {
  encryptionKey: 'db0031e2-04e7-11e1-86ad-000c290196f7'
};

var app = bogart.app();
app.use(bogart.middleware.flash(flashConfig));

app.get('/', function (req) {
  var html  = '<html><head><title>Bogart Flash</title></head><body><h1>Bogart Flash Middleware</h1>';
  html += '<p>A random number has been inserted into flash. ' +
    'On the first request, the value should be undefined. Subsequent requests should ' +
    'display the random number set on the previous request. ' +
    'Refresh the page to see the flash value change.</p>' +
    'Existing Flash: '+ req.flash('foo') +'<br />';

  req.flash('foo', Math.random() * 10);

  return bogart.html(html);
});

app.start();
