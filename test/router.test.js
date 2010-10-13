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
  
exports['test matches parameter'] = function() {
  var
    name, req = rootRequest,
    router = bogart.router(function(get) {
     get('/hello/:name', function(req) {
       name = req.params.name;
       return bogart.html("hello");
     });
    });

  req.pathInfo = '/hello/nathan';

  return when(router(req), function(resp) {
    assert.equal(200, resp.status);
    assert.equal("nathan", name);
  });
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

exports['test should not partially match route from beginning'] = function() {
  var 
    req = rootRequest,
    router;

  router = bogart.router(function(get) {
    get('/:foo', function(req) {
      return {
        status: 200,
        body: ['hello']
      };
    });
  });

  req.pathInfo = '/hello/world';

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

exports['test regex route'] = function() {
  var
    router,
    req = rootRequest,
    splat;

  req.pathInfo = '/hello/world';

  router = bogart.router(function(get) {
    get(/\/hello\/(.*)/, function(req) {
      splat = req.params.splat;
      return bogart.html("hello");
    });
  });

  return when(router(req), function(resp) {
    assert.equal(200, resp.status);
    assert.ok(splat, "Should have set 'splat'");
    assert.equal(splat[0], 'world');
  });
};

if(require.main == module) {
  require("patr/runner").run(exports);
}
