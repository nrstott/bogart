var bogart = require('../lib/bogart')
  , Q      = require("promised-io/lib/promise")
  , assert = require('assert')
  , path   = require('path')
  , fs     = require('fs');

exports["test parses JSON"] = function(beforeExit) {
  var forEachDeferred = Q.defer()
    , app
    , body
    , headers = { 'content-type': 'application/json' }
    , request = { headers: headers }
    , processedReq;

  body = {
    forEach: function(callback) {
      callback(JSON.stringify({ a: '1' }));
      return forEachDeferred;
    }
  };

  request.body = body;

  app = bogart.middleware.ParseJson(function(req) {
    processedReq = req;
  });

  app(request);

  forEachDeferred.resolve();

  beforeExit(function() {
    assert.ok(processedReq !== undefined);
    assert.equal('1', processedReq.body.a);
  })
};

exports["test parses form"] = function(beforeExit) {
  var forEachDeferred = Q.defer()
    , app
    , body
    , headers = { 'content-type': 'application/x-www-form-urlencoded' }
    , request = { headers: headers }
    , processedReq;
  
  body = {
    forEach: function(callback) {
      callback('a=1');
      return forEachDeferred;
    }
  };

  request.body = body;

  app = bogart.middleware.ParseForm(function(req) {
    processedReq = req;
  });

  app(request);

  forEachDeferred.resolve();

  beforeExit(function() {
    assert.ok(processedReq !== undefined);
    assert.equal('object', typeof processedReq.body, 'Body should be an object');
    assert.equal('1', processedReq.body.a);
  });
};

exports["test method override"] = function(beforeExit) {
  var request = { method: 'POST', env: {} }
    , headers = { 'content-type': 'text/html' }
    , app;

  request.body    = { _method: 'PUT' };
  request.headers = headers;

  app = bogart.middleware.MethodOverride(function(req) {});
  app(request);

  beforeExit(function() {
    assert.equal('PUT', request.method, 'Should change method to PUT');
  });
};

exports["test gzip"] = function(beforeExit) {
  var response = null;
  
  var app = bogart.middleware.Gzip(function(req) {
    return bogart.html('Hello World');
  });

  var appPromise = app({ method: 'GET', env: {} });
  Q.when(appPromise, function(jsgiResp) { 
    response = jsgiResp;
  });

  beforeExit(function() {
    assert.isNotNull(response, 'Response should not be null');
    assert.ok(response.body, 'Response should have a body');
  });
};

exports["test gzip downloads as text/html"] = function(beforeExit) {
  var response = null;

  var router = bogart.router();
  var viewEngine = bogart.viewEngine('mustache', path.join(__dirname, 'fixtures'));

  router.get('/', function() {
      return viewEngine.respond('index.mustache', { layout: false }); 
  });

  var Gzip = bogart.middleware.Gzip;
  var app = Gzip(router);

  Q.when(app({ method: 'GET', env: {}, headers: {}, pathInfo: '/' }), function(resp) {
    response = resp;
  });

  beforeExit(function() {
    assert.isNotNull(response, 'Repsones should not be null');
    assert.equal(200, response.status);
    assert.equal('text/html', response.headers['content-type']);
  });
};

exports["test parted json"] = function(beforeExit) {
  var request       = null
    , parted        = new bogart.middleware.Parted(function(req) { request = req; return {}; });
  
  response = parted({
    method: 'POST',
    env: {},
    headers: { 'content-type': 'application/json' },
    body: [ '{ "hello": "world" }' ]
  });

  beforeExit(function() {
    assert.isNotNull(request);
    assert.isNotNull(request.body);
    assert.equal('object', typeof request.body);
    assert.equal('world', request.body.hello);
  });
};

exports["test parted multipart"] = function(beforeExit) {
  var request = null
    , parted  = new bogart.middleware.Parted(function(req) { request = req; return {}; });
  
  fs.readFileSync(path.join(__dirname, 'fixtures', 'chrome.part'));
  
  response = parted(multipartRequest(100, 'chrome'));

  beforeExit(function() {
    assert.ok(!!request.body);
    assert.ok(!!request.body.content, 'No file path');
  });
};

/**
 * Create a mock request
 * 
 * Modified from the mock request method in Parted in compliance with the license.
 */
function multipartRequest(size, file) {
  file = path.join(__dirname, 'fixtures', file + '.part');

  var stream = fs.createReadStream(file, {
    bufferSize: size
  });

  var boundary = fs
    .readFileSync(file)
    .toString('utf8')
    .match(/--[^\r\n]+/)[0]
    .slice(2);

  return {
    headers: {
      'content-type': 'multipart/form-data; boundary="' + boundary + '"'
    },
    method: 'POST',
    env: {},
    pipe: function(dest) {
      stream.pipe(dest);
    },
    emit: function(ev, err) {
      if (ev === 'error') this.errback && this.errback(err);
      return this;
    },
    on: function(ev, func) {
      if (ev === 'error') this.errback = func;
      return this;
    },
    destroy: function() {
      stream.destroy();
      return this;
    },
    body: {
      forEach: function(fn) {
        var deferred = Q.defer();

        stream.on('data', function(data) {
          fn(data);
        });

        stream.on('end', function() {
          deferred.resolve();
        });

        return deferred.promise;
      }
    }
  };
};
