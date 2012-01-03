var bogart    = require('../lib/bogart')
  , Q         = require("promised-io/lib/promise")
  , path      = require('path')
  , fs        = require('fs')
  , security  = require("../lib/security")
  , util      = require('util')
  , test      = require('tap').test
  , plan      = require('tap').plan;

test("test parses JSON", function(t) {
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
    t.ok(req !== undefined);
    t.equal('1', req.body.a, 'req.body.a should equal "1"');
  });

  process.nextTick(function() {
    app(request);
  });
  
  forEachDeferred.resolve();

  t.plan(2);
});

test("test parses form", function(t) {
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
    t.ok(req, 'req should not be falsey');
    t.type(req.body, 'object', 'Body should be an object');
    t.equal('1', req.body.a);
  });

  process.nextTick(function() {
    app(request);
  });
  
  forEachDeferred.resolve();

  t.plan(3);
});

test("test method override", function(t) {
  var request = { method: 'POST', env: {} }
    , headers = { 'content-type': 'text/html' }
    , app;

  request.body    = { _method: 'PUT' };
  request.headers = headers;

  app = bogart.middleware.MethodOverride(function(req) {});
  Q.when(app(request), function() {
    t.equal('PUT', request.method, 'Should change method to PUT');
  }, function(err) {
    console.log('error', err);
    t.end();
  });

  t.plan(1);
});

test("test gzip", function(t) {
  var app = bogart.middleware.Gzip(function(req) {
    return bogart.html('Hello World');
  });

  var appPromise = app({ method: 'GET', env: {} });
  Q.when(appPromise, function(resp) { 
    t.ok(resp, 'Response should not be falsey');
    t.ok(resp.body, 'Response should have a body');
  }, function(err) {
    console.log('error', err);
    t.end();
  });

  t.plan(2);
});

test("test gzip downloads as text/html", function(t) {
  var router = bogart.router();
  var viewEngine = bogart.viewEngine('mustache', path.join(__dirname, 'fixtures'));

  router.get('/', function() {
      return viewEngine.respond('index.mustache', { layout: false }); 
  });

  var Gzip = bogart.middleware.Gzip;
  var app = Gzip(router);

  Q.when(app({ method: 'GET', env: {}, headers: {}, pathInfo: '/' }), function(resp) {
    t.ok(resp, 'Response should not be falsey');
    t.equal(resp.status, 200);
    t.equal(resp.headers['content-type'], 'text/html');
  }, function(err) {
    console.log('error', err);
    t.end();
  });

  t.plan(3);
});

test("test error middleware has default response when error is thrown", function(t) {
  var app      = new bogart.middleware.Error(function(req) { throw new Error('intentional'); });
  
  Q.when(app({ method: 'GET', env: {}, headers: {}, pathInfo: '/' }), function(resp) {
    t.ok(resp, 'Response should not be falsey');
    t.equal(resp.status, 500);
    t.equal(resp.headers['content-type'], 'text/html');
  }, function(err) {
    console.log('error', err);
    t.end();
  });

  t.plan(3);
});

test("test flash", function(t) {
  var app
    , headers = { 'content-type': 'text/plain' }
    , request = { headers: headers, body:[] }
    , foo
    , cookieStr;
    
  app = bogart.middleware.Flash({}, function(req) {
    req.flash("foo", "bar");

    foo = req.flash("foo");
    return {
      status: 200,
      body: [],
    }
  });

  Q.when(app(request), function(resp) {
    initialResp = resp;
    cookieStr = initialResp.headers["Set-Cookie"].join("").replace(/;$/, "");

    // the first attempt to retrieve "foo" should be undefined
    t.type(foo, 'undefined', 'Foo should be undefined');

    request.headers.cookie = cookieStr;
    Q.when(app(request), function() {
      t.equal(foo, 'bar', 'foo should equal bar');
    });
  });

  t.plan(2);
});


test("test error middleware has default response when promise is rejected", function(t) {
  var app = new bogart.middleware.Error(function(req) { return bogart.Q.reject('rejected'); });
  
  Q.when(app({ method: 'GET', env: {}, headers: {}, pathInfo: '/' }), function(resp) {
    t.ok(resp, 'Response should not be falsey');
    t.equal(resp.status, 500);
    t.equal(resp.headers['content-type'], 'text/html', 'Content-Type should be text/html');
  });

  t.plan(3);
});

test("test parted json", function(t) {
  var request = null
    , parted = new bogart.middleware.Parted(function(req) { request = req; return {}; });

  bogart.middleware.parted(function(req) {
    t.ok(req, 'Request should not be falsey');
    t.type(req.body, 'object', 'Request body should be an object');
    t.equal(req.body.hello, 'world', 'req.body.hello should equal "world"');
  })({
    method: 'POST',
    env: {},
    headers: { 'content-type': 'application/json' },
    body: [ '{ "hello": "world" }' ]
  });

  t.plan(3);
});

test("test parted form", function(t) {
  var body        = {}
    , bodyDefer   = Q.defer()
    , parted;

  body.forEach = function(callback) {
    callback('hello=one&hello=two');

    return bodyDefer.promise;
  };

  parted = new bogart.middleware.Parted(function(req) {
    t.ok(req, 'Request should not be falsey');
    t.ok(req.body, 'Body should not be falsey');
    t.ok(req.body.hello, 'Hello should not be falsey');
    t.equal(req.body.hello.length, 2);
    t.end();
  });
  
  parted({
    method: 'POST',
    env: {},
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body
  });

  process.nextTick(function() {
    bodyDefer.resolve();
  });
});

test("test parted multipart", function(t) {
  var parted;
  
  parted = new bogart.middleware.Parted(function(req) {
    t.ok(!!req.body);
    t.ok(!!req.body.content, 'No file path');
  });
  
  process.nextTick(function() {
    parted(multipartRequest(100, 'chrome'));
  });

  t.plan(2);
});

test("test session", function(t) {
  var app
    , headers = { 'content-type': 'text/plain' }
    , request = { headers: headers, body:[] }
    , values = []
    , firstRequest = true;
    
  app = bogart.middleware.Session({}, function(req) {
    if(firstRequest) {
      req.session("foo", "bar");
      firstRequest = false;
    }

    values.push(req.session("foo"));

    return {
      status: 200,
      body: [],
    }
  });

  Q.when(app(request), function(initialResp) {
    var cookieStr = initialResp.headers["Set-Cookie"].join("").replace(/;$/, "");

    request.headers.cookie = cookieStr;

    Q.when(app(request), function(resp) {
      t.equal(values.length, 2);
      values.forEach(function(val) {
        t.ok(val, 'bar');
      });
    });
  });
  
  t.plan(3);
});

test("test validate response", function(t) {  
  bogart.middleware.validateResponse(function(req) {
    return null;
  })().then(null, function(err) {
    t.equal(err, 'Response must be an object.');
  });

  bogart.middleware.validateResponse(function(req) {
    return {
      status: 200,
      headers: {}
    };
  })().then(null, function(err) {
    t.equal(err, 'Response must have a body property.');
  });

  bogart.middleware.validateResponse(function(req) {
    return {
      status: 200,
      headers: {},
      body: {}
    };
  })().then(null, function(err) {
    t.equal(err, 'Response body must have a forEach method.');
  });

  bogart.middleware.validateResponse(function(req) {
    return {
      status: 200,
      headers: {},
      body: {
        forEach: 'not a function'
      }
    };
  })().then(null, function(err) {
    t.equal(err, 'Response body has a forEach method but the forEach method is not a function.');
  });

  bogart.middleware.validateResponse(function(req) {
    return {
      headers: {},
      body: []
    };
  })().then(null, function(err) {
    t.equal(err, 'Response must have a status property.');
  });

  bogart.middleware.validateResponse(function(req) {
    return {
      status: '200',
      body: [],
      headers: {}
    };
  })().then(null, function(err) {
    t.equal(err, 'Response has a status property but the status property must be a number.');
  });

  t.plan(6);
});

test("test bodyAdapter adapts Stream", function(t) {
  var Stream = require('stream').Stream;

  function TestReadStream() {
    Stream.call(this);

    var args = Array.prototype.slice.call(arguments)
      , self = this;

    process.nextTick(function emitData() {
      var x = args.shift();
      if (x === undefined) {
        self.emit('end');
        return;
      }

      self.emit('data', x);

      //process.nextTick(function() {
        emitData();
      //});
    });

    this.readable = true;
  }

  util.inherits(TestReadStream, Stream);

  var streamAdapter = bogart.middleware.bodyAdapter(function(req) {
    return new TestReadStream('hello', ' ', 'world');
  });

  Q.when(streamAdapter(), function(resp) {
    var str = '';

    t.ok(resp, 'Response should not be falsey');
    t.ok(resp.body, 'Response should have a body');
    t.ok(resp.body.forEach, 'Response body should be forEachable');

    return resp.body.forEach(function(x) {
      str += x;
    }).then(function() {
      t.equal(str, 'hello world', 'should equal hello world');
      t.end();
    }, function(err) {
      t.ok(false, err, 'found error');
      t.end();
    });
  });
});

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
