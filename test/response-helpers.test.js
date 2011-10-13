var bogart = require('../lib/bogart')
  , assert = require('assert')
  , Q      = require('promised-io/lib/promise')
  , when   = Q.when
  , path   = require('path')
  , fs     = require('fs');


exports["test json should have status 200"] = function() {
  var resp = bogart.json({});
  
  assert.equal(200, resp.status);
};

exports["test json should have status 403"] = function() {
  var status = 403
    , resp = bogart.json({}, { status: status });
  
  assert.equal(status, resp.status);
};

exports["test json should have body"] = function() {
  var bodyObj = { hello: "world" }
    , resp = bogart.json(bodyObj);
  
  assert.equal(JSON.stringify(bodyObj), resp.body.join());
};

exports["test error should have status 500"] = function() {
  var resp = bogart.error();
    
  assert.equal(500, resp.status);
};

exports["test error should have status 403"] = function() {
  var resp = bogart.error("", { status: 403 });
  
  assert.equal(403, resp.status);
};

exports["test should have status 200"] = function() {
  var resp = bogart.html();
    
   assert.equal(200, resp.status);
};

exports["test html should have status 404"] = function() {
  var resp = bogart.html("", { status: 404 });
  
  assert.equal(404, resp.status);
};

exports["test html should have HTML"] = function() {
var str = "Hello World"
  , resp = bogart.html(str);
  
  assert.equal(str, resp.body.join());
};

exports["test should be text/html"] = function() {
  var resp = bogart.html();
  
  assert.equal("text/html", resp.headers["content-type"])
};

exports["test should have content-length 5"] = function() {
  var str = "hello"
    , resp = bogart.html(str);
  
  assert.equal(5, resp.headers["content-length"]);
};

exports["test pipe stream"] = function(beforeExit) {
  var readStream = fs.createReadStream(path.join(__dirname, 'fixtures', 'text.txt'))
    , pipe       = bogart.pipe(readStream)
    , response   = null
    , written    = '';

  pipe.then(function(resp) {
    response = resp;
    resp.body.forEach(function(data) {
      written += data;
    });
  });

  beforeExit(function() {
    assert.isNotNull(response, 'Response should not be null');
    assert.equal('Hello World', written);
  });
};

exports["test pipe forEachable"] = function(beforeExit) {
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
  });

  beforeExit(function() {
    assert.equal(msg, written);
  });
};

exports["test bogart.redirect merges opts"] = function(beforeExit) {
  var opts = {
    hello: 'world'
  };

  var resp = bogart.redirect('/', opts);

  assert.equal('world', resp.hello);
};

exports["test bogart.redirect merges headers"] = function(beforeExit) {
  var opts = {
    headers: { hello: 'world' }
  };

  var resp = bogart.redirect('/', opts);

  assert.equal('world', resp.headers.hello);
  assert.ok('location' in resp.headers);
};
