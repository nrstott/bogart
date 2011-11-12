var bogart = require('../lib/bogart')
  , assert = require('assert')
  , Q      = require('promised-io/lib/promise')
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

function getMock(path) {
  return {
    headers: {},
    pathInfo: path,
    method: 'GET',
    jsgi: { version: [0,3] },
    env: {}
  };
}
  
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
exports['test order of routes matching should be longest to smallest'] = function(){
  var
    name, req = rootRequest(),
    router = bogart.router(function(get) {
     get('/hello/:name', function(req) {
       name = req.params.name;
       assert.ok (false, "should have matched the longest route");
       return bogart.html("hello");
     });
      get("/hello/:name/:something", function(req){
         name = req.params.name;
         return bogart.html("hello");
         assert.ok(true, "long route matched successfully")
      })
    });

  req.pathInfo = '/hello/nathan/';

  return when(router(req), function(resp) {
    //do nothing
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

exports['test should have status 500 if body is not a forEachable'] = function(beforeExit) {
  var response
    , router;
    
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
  });

  beforeExit(function() {
    assert.equal(500, response.status);
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

  req.pathInfo = '/hello/cruel/world';

  router = bogart.router();

  router.get(/\/hello\/(.*)/, function(req) {
    splat = req.params.splat;
    return bogart.html("hello");
  });

  when(router(req), function(resp) {
    response = resp;
  });

  beforeExit(function() {
    assert.isNotNull(response);
    assert.equal(200, response.status);
    assert.ok(splat, "Should have set 'splat'");
    assert.equal(splat[0], 'cruel');
    assert.equal(splat[1], 'world');    
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

exports['test matches a dot (".") as part of a named param'] = function(beforeExit) {
  var router
    , foo = null;
  
  router = bogart.router();
  router.get('/:foo/:bar', function(req) {
    foo = req.params.foo;
  });

  router(getMock('/user@example.com/name'));

  beforeExit(function() {
    assert.isNotNull(foo, 'Named parameter should not be null');
    assert.equal('user@example.com', foo);
  });
};

exports['test matches empty `pathInfo` to "/" if no route is defined for ""'] = function(beforeExit) {
  var router
    , response;
  
  router = bogart.router();
  router.get('/', function(req) {
    return bogart.text('success');
  });

  response = router(getMock(''));

  beforeExit(function() {
    assert.equal('success', response.body);
  });
};

exports['test matches empty `pathInfo` to "" if a route is defined for ""'] = function(beforeExit) {
  var router
    , response;
  
  router = bogart.router();
  router.get('', function(req) {
    return bogart.text('right');
  });

  router.get('/', function(req) {
    return bogart.text('wrong');
  });

  response = router(getMock(''));

  beforeExit(function() {
    assert.equal('right', response.body);
  });
};
