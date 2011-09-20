var bogart = require('../lib/bogart')
  , Q      = require("q")
  , assert = require('assert');

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
    assert.ok(processedReq !== undefined, 'route handler callback should have been called');
    assert.equal('1', processedReq.body.a);
  });
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