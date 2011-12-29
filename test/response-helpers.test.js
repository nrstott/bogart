var bogart = require('../lib/bogart')
  , Q      = require('promised-io/lib/promise')
  , when   = Q.when
  , path   = require('path')
  , fs     = require('fs')
  , test   = require('tap').test
  , plan   = require('tap').plan;

test("test json should have status 200", function(t) {
  var resp = bogart.json({});
  
  t.equal(resp.status, 200);
  t.end();
});

test("test json should have status 403", function(t) {
  var status = 403
    , resp = bogart.json({}, { status: status });
  
  t.equal(resp.status, status);
  t.end();
});

test("test json should have body", function(t) {
  var bodyObj = { hello: "world" }
    , resp = bogart.json(bodyObj);
  
  t.equal(resp.body.join(), JSON.stringify(bodyObj));
  t.end();
});

test("test error should have status 500", function(t) {
  var resp = bogart.error();
    
  t.equal(resp.status, 500);
  t.end();
});

test("test error should have status 403", function(t) {
  var resp = bogart.error("", { status: 403 });
  
  t.equal(resp.status, 403);
  t.end();
});

test("test should have status 200", function(t) {
  var resp = bogart.html();
    
  t.equal(resp.status, 200);
  t.end();
});

test("test html should have status 404", function(t) {
  var resp = bogart.html("", { status: 404 });
  
  t.equal(resp.status, 404);
  t.end();
});

test("test html should have HTML", function(t) {
  var str = "Hello World"
    , resp = bogart.html(str);
  
  t.equal(str, resp.body.join());
  t.end();
});

test("test should be text/html", function(t) {
  var resp = bogart.html();
  
  t.equal(resp.headers["content-type"], "text/html");
  t.end();
});

test("test should have content-length 5", function(t) {
  var str = "hello"
    , resp = bogart.html(str);
  
  t.equal(resp.headers["content-length"], 5);
  t.end();
});

test("test pipe stream", function(t) {
  var readStream = fs.createReadStream(path.join(__dirname, 'fixtures', 'text.txt'))
    , pipe       = bogart.pipe(readStream)
    , written    = '';

  pipe.then(function(resp) {
    Q.when(resp.body.forEach(function(data) {
      written += data;
    }), function() {
      t.equal(written, 'Hello World');
    });
  });

  t.plan(1);
});

test("test pipe forEachable", function(t) {
  var forEachable = {}
    , deferred    = Q.defer()
    , msg         = 'Hello World'
    , resp
    , written     = '';
  
  forEachable.forEach = function(callback) {
    callback(msg);
    return deferred.promise;
  };

  resp = bogart.pipe(forEachable);

  deferred.resolve();

  resp.then(function(resp) {
    return resp.body.forEach(function(data) {
      written += data;
    });
  }).then(function() {
    t.equal(written, msg);
  });

  t.plan(1);
});

test("test bogart.redirect merges opts", function(t) {
  var opts = {
    hello: 'world'
  };

  var resp = bogart.redirect('/', opts);

  t.equal(resp.hello, 'world');
  t.end();
});

test("test bogart.redirect merges headers", function(t) {
  var opts = {
    headers: { hello: 'world' }
  };

  var resp = bogart.redirect('/', opts);

  t.equal(resp.headers.hello, 'world');
  t.ok('location' in resp.headers);
  t.end();
});
