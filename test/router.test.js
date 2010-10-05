var
  bogart = require('../lib/bogart'),
  assert = require('assert'),
  Q      = require('promised-io/promise'),
  when   = Q.when,
  jsgi   = require('jsgi'),
  rootRequest = {
    headers: {},
    pathInfo: '/',
    method: 'GET',
    jsgi: { version: [0, 3] },
    env: {}
  };

exports['test should call notFoundApp'] = function() {
  var
    called = false,
    notFoundApp = function(req) {
      called = true;
      return { status: 409, body: [ '' ] };
    },
    router = bogart.router(function() {}, notFoundApp),
    respPromise = router(rootRequest);
    
  return when(respPromise, function(resp) {
    assert.equal(409, resp.status);
    assert.ok(called);
  });
};

exports['test should have default notFoundApp behavior of returning 404'] = function() {
  var
    router = bogart.router(function(){}),
    respPromise = router(rootRequest);
  
  return when(respPromise, function(resp) {
    assert.equal(404, resp.status);
  });
};

exports['test should have status 500 if body is not a forEachable'] = function() {
  var
    router = bogart.router(function(get) {
      get('/', function(req) {
        return {
          status: 200,
          body: "hello"      
        };
      });
    }),
    respPromise = router(rootRequest);

  return when(respPromise, function(resp) {
    assert.equal(500, resp.status);
  });
};

exports['test should not partially match route'] = function() {
  var
    router = bogart.router(function(get) {
      get('/partial', function(req) {
        return {
          status: 200,
          body: ['hello']
        }
      })
    }),
    req = rootRequest;

  req.pathInfo = '/partial/path';
  
  return when(router(req), function(resp) {
    assert.equal(404, resp.status);
  });
};

exports['test should match route with querystring'] = function() {
  var
    router = bogart.router(function(get) {
      get('/home', function(req) {
        return {
          status: 200,
          body: ['home']
        }
      });
    }),
    req = rootRequest;

  req.pathInfo = '/home';
  req.queryString = "hello=world";

  return when(router(req), function(resp) { assert.equal(200, resp.status); });
};

if(require.main == module) {
  require("patr/runner").run(exports);
}
