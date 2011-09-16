var bogart = require('../lib/bogart')
  , assert = require('assert')
  , Q      = require('q-util')
  , when   = Q.when
  , jsgi   = require('jsgi')
  , rootRequest = function() {
    return {
      headers: {},
      pathInfo: '/',
      method: 'GET',
      jsgi: { version: [0, 3] },
      env: {}
    };
 };
  
exports['test matches parameter'] = function(beforeExit) {
  var
    name, req = rootRequest(), response,
    router = bogart.router(function(get) {
     get('/hello/:name', function(req) {
       name = req.params.name;
       return bogart.html("hello");
     });
    });

  req.pathInfo = '/hello/nathan';

  when(router(req), function(resp) {
    response = resp;
  });

  beforeExit(function() {
    assert.equal(200, response.status);
    assert.equal("nathan", name);    
  });
};

exports['test should call notFoundApp'] = function(beforeExit) {
  var called = false
    , notFoundApp = function(req) {
        called = true;
        return { status: 409, body: [ '' ] };
      }
    , router = bogart.router(function() {}, notFoundApp)
    , respPromise = router(rootRequest())
    , response;
  
  when(respPromise, function(resp) {
    response = resp;
  });
    
  beforeExit(function() {
    assert.equal(409, response.status);
    assert.ok(called);    
  });
};

exports['test should have default notFoundApp behavior of returning 404'] = function(beforeExit) {
  var router = bogart.router(function(){})
    , respPromise = router(rootRequest())
    , response;
  
  when(respPromise, function(resp) {
    response = resp;
  });

  beforeExit(function() {
    assert.equal(404, response.status);
  });
};

exports['test should reject promise if body is not forEachable'] = function(beforeExit) {
  var response
    , router
    , rejected = false;
    
  router = bogart.router(function(get) {
    get('/', function(req) {
      return {
        status: 200,
        body: "hello"      
      };
    });
  });

  when(router(rootRequest()), function(resp) {
    response = resp;
  }, function(err) {
    rejected = true;
  });

  beforeExit(function() {
    assert.ok(response === undefined, 'Response should be undefined');
    assert.ok(rejected, 'Should have rejected promise');
  });
};

exports['test should not partially match route'] = function(beforeExit) {
  var router = bogart.router(function(get) {
      get('/partial', function(req) {
        return {
          status: 200,
          body: ['hello']
        }
      })
    })
    , req = rootRequest()
    , response;

  req.pathInfo = '/partial/path';
  
  when(router(req), function(resp) {
    response = resp;
  });

  beforeExit(function() {
    assert.equal(404, response.status);
  })
};

exports['test should not partially match route from beginning'] = function(beforeExit) {
  var req = rootRequest()
    , router
    , response;

  router = bogart.router(function(get) {
    get('/:foo', function(req) {
      return {
        status: 200,
        body: ['hello']
      };
    });
  });

  req.pathInfo = '/hello/world';

  when(router(req), function(resp) {
    response = resp;
  });

  beforeExit(function() {
    assert.equal(404, response.status);
  });
};

exports['test should match route with querystring'] = function(beforeExit) {
  var req = rootRequest()
    , router
    , response;

  router = bogart.router(function(get) {
    get('/home', function(req) {
      return {
        status: 200,
        body: ['home']
      }
    });
  });

  req.pathInfo = '/home';
  req.queryString = "hello=world";

  when(router(req), function(resp) { response = resp; });

  beforeExit(function() {
    assert.isNotNull(response);
    assert.equal(200, response.status);
  });
};

exports['test regex route'] = function(beforeExit) {
  var router
    , req = rootRequest()
    , splat
    , response;

  req.pathInfo = '/hello/world';

  router = bogart.router(function(get) {
    get(/\/hello\/(.*)/, function(req) {
      splat = req.params.splat;
      return bogart.html("hello");
    });
  });

  when(router(req), function(resp) {
    response = resp;
  });

  beforeExit(function() {
    assert.isNotNull(response);
    assert.equal(200, response.status);
    assert.ok(splat, "Should have set 'splat'");
    assert.equal(splat[0], 'world');
  });
};

exports['test should have X-Powered-By Bogart header'] = function(beforeExit) {
  var router
    , response;

  router = bogart.router(function(get) {
    get('/', function(req) {
      return bogart.html('hello world');
    });
  });

  when(router(rootRequest()), function(resp) {
    response = resp;
  });

  beforeExit(function() {
    assert.isDefined(response);
    assert.isDefined(response.headers);
    assert.isDefined(response.headers['X-Powered-By'], 'X-Powered-By header should be defined');

    assert.equal('Bogart', response.headers['X-Powered-By']);
  });
};
