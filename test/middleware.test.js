var bogart = require('../lib/bogart')
  , Q      = require("promised-io/lib/promise")
  , assert = require('assert')
  , path   = require('path');

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