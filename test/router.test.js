var bogart = require('../lib/bogart')
  , Q      = require('promised-io/lib/promise')
  , when   = Q.when
  , jsgi   = require('jsgi')
  , test   = require('tap').test
  , plan   = require('tap').plan;

function mockRequest(path) {
  return {
    headers: {},
    pathInfo: path,
    method: 'GET',
    jsgi: { version: [0,3] },
    env: {}
  };
}

function rootRequest() {
  return mockRequest('/');
}

/**
 * Define a simple router that has a route that matches `path`
 * @param {String} path  The path to match
 */
function simpleRouter(path) {
  var router = bogart.router();

  router.get(path, bogart.noop);

  return router;
}
  
test('matches parameter', function(t) {
  var name
    , req = rootRequest()
    , router = bogart.router(function(get) {
        get('/hello/:name', function(req) {
          name = req.params.name;
          return bogart.html("hello");
        });
      });

  req.pathInfo = '/hello/nathan';

  when(router(req), function(resp) {
    t.equal(resp.status, 200);
    t.equal(name, 'nathan');
  });

  t.plan(2);
});

test('order of routes matching should be in order defined', function(t) {
  var name
    , req     = mockRequest('/hello/nathan')
    , router  = bogart.router(function(get) {
                  get('/hello/:name', function(req) {
                    t.ok(true);
                  });
                  get("/hello/:name/:something", function(req){
                    t.fail("second route matched incorrectly");
                  })
                });

  router(req);

  t.plan(1);
});


test('should call notFoundApp', function(t) {
  var called = false
    , notFoundApp = function(req) {
        called = true;
        return { status: 409, body: [ '' ] };
      }
    , router = bogart.router(function() {}, notFoundApp)
    , respPromise = router(rootRequest());
  
  when(respPromise, function(resp) {
    t.equal(resp.status, 409);
  }, function() {
    t.fail('Promise should not be rejected');
  });
  
  t.plan(1);
});

test('should have default notFoundApp behavior of returning 404', function(t) {
  var router = bogart.router(function(){})
    , respPromise = router(rootRequest());
  
  when(respPromise, function(resp) {
    t.equal(resp.status, 404);
  });

  t.plan(1);
});

test('should not partially match route', function(t) {
  var router = bogart.router(function(get) {
      get('/partial', function(req) {
        return {
          status: 200,
          body: ['hello']
        }
      })
    })
    , req = rootRequest();

  req.pathInfo = '/partial/path';
  
  when(router(req), function(resp) {
    t.equal(resp.status, 404, 'Status should be 404');
  });

  t.plan(1);
});

test('should not partially match route from beginning', function(t) {
  var req = rootRequest()
    , router;

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
    t.equal(resp.status, 404, 'Status should be 404');
  });

  t.plan(1);
});

test('should match route with querystring', function(t) {
  var req = rootRequest()
    , router;

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

  when(router(req), function(resp) {
    t.equal(resp.status, 200, 'Status should be 200');
  }, function(err) {
    t.fail('Promise should not have been rejected');
  });

  t.plan(1);
});

test('regex route', function(t) {
  var router
    , req = rootRequest()
    , splat;

  req.pathInfo = '/hello/cruel/world';

  router = bogart.router();

  router.get(/\/hello\/(.*)\/(.*)/, function(req) {
    splat = req.params.splat;
    return bogart.html("hello");
  });

  when(router(req), function(resp) {
    t.equal(resp.status, 200, 'Status should be 200');
    t.ok(splat, 'Should have set \'splat\'');
    t.equal(splat[0], 'cruel', 'Should have correct value for splat[0]');
    t.equal(splat[1], 'world', 'Should have correct value for splat[1]');
  }, function() {
    t.fail('Promise should not have been rejected');
  });

  t.plan(4);
});

test('handles encoded slashes', function(t) {
  var router = bogart.router()
    , called = false;

  router.get('/:foo', function() {
    t.ok(true, 'Should call route handler');
  });

  router(mockRequest('/foo%2Fbar'));

  t.plan(1);
});

test('matches a dot (".") as part of a named param', function(t) {
  var router
    , foo = null;
  
  router = bogart.router();
  router.get('/:foo/:bar', function(req) {
    t.equal(req.params.foo, 'user@example.com', 'Named parameter should be matched correctly');
  });

  router(mockRequest('/user@example.com/name'));

  t.plan(1);
});

test('matches empty `pathInfo` to "/" if no route is defined for ""', function(t) {
  var router;
  
  router = bogart.router();
  router.get('/', function(req) {
    return bogart.text('success');
  });

  when(router(mockRequest('')), function(resp) {
    t.equal(resp.body.join(''), 'success', 'Should have matched "/" route');
  });

  t.plan(1);
});

test('matches empty `pathInfo` to "" if a route is defined for ""', function(t) {
  var router = bogart.router();

  router.get('', function(req) {
    return bogart.text('right');
  });

  router.get('/', function(req) {
    return bogart.text('wrong');
  });

  when(router(mockRequest('')), function(resp) {
    t.equal(resp.body.join(''), 'right');
  });

  t.plan(1);
});

test('matches paths that include encoded spaces', function(t) {
  var router = bogart.router();

  router.get('/path with spaces', function(req) {
    return bogart.text('spaces are cool');
  });

  when(router(mockRequest('/path%20with%20spaces')), function(resp) {
    t.equal(resp.body[0], 'spaces are cool');
  }, function() {
    t.fail('Promise should not have been rejected');
  });

  t.plan(1);
});

test('matches dot (".") literally in paths', function(t) {
  var router = simpleRouter('/foo.bar');

  when(router(mockRequest('/foo.bar')), function(resp) {
    t.ok(resp);
  }, function() {
    t.fail('Promise should not have been rejected');
  });

  t.plan(1);
});

test('supports splat ("*")', function(t) {
  var router = bogart.router();
  
  router.get('/foo/*', function(req) {
    return bogart.text('splatted '+req.params.splat[0]);
  });
  
  when(router(mockRequest('/foo/hello/there')), function(resp) {
    t.equal(resp.body.join(''), 'splatted hello/there');
  });

  t.plan(1);
});

test('supports multiple splat params', function(t) {
  var router = bogart.router();
  
  router.get('/download/*/*', function(req) {
    return bogart.text(req.params.splat[0]+'/'+req.params.splat[1]);
  });

  when(router(mockRequest('/download/images/ninja-cat.jpg')), function(resp) {
    t.equal(resp.body.join(''), 'images/ninja-cat.jpg');
  });

  t.plan(1);
});

test('supports mixing named and splat parameters', function(t) {
  var router = bogart.router();
  
  router.get('/:foo/*', function(req) {
    return bogart.text(req.params.foo+' '+req.params.splat[0]);
  });

  when(router(mockRequest('/foo/bar/baz')), function(resp) {
    t.equal(resp.body.join(''), 'foo bar/baz');
  }, function() {
    t.fail('Promise should not have been rejected');
  });

  t.plan(1);
});

test('calls next app when handler returns `undefined`', function(t) {
  var str = 'Hello from next app!'
    , router;
  
  router = bogart.router(null, function(req) {
    return bogart.text(str);
  });

  router.get('/', function(req) {});

  when(router(mockRequest('/')), function(resp) {
    t.equal(resp.body[0], str);
  }, function() {
    t.fail('Promise should not have been rejected');
  });

  t.plan(1);
});

test('middleware in routes', function(t) {
  var router = bogart.router();

  router.get('/', function(req, next) {
    req.hello = 'world';
    return next(req);
  }, function(req) {
    return bogart.text(req.hello);
  });

  router(mockRequest('/')).then(function(resp) {
    t.equal(resp.body[0], 'world');
  }, function() {
    t.fail('Promise should not have been rejected');
  });

  t.plan(1);
});
