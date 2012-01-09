var bogart    = require('../lib/bogart')
  , Q         = require("promised-io/lib/promise")
  , path      = require('path')
  , fs        = require('fs')
  , security  = require("../lib/security")
  , util      = require('util')
  , test      = require('tap').test
  , plan      = require('tap').plan;

function mockRequest(path) {
  return {
    headers: {},
    pathInfo: path,
    method: 'GET',
    jsgi: { version: [0,3] },
    env: {}
  };
}

test("test parses JSON", function(t) {
  var forEachDeferred = Q.defer()
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

  process.nextTick(function() {
    bogart.middleware.parseJson()(request, function(req) {
        t.ok(!!req);
        t.equal('1', req.body.a, 'req.body.a should equal "1"');
        t.end();
    });
  });
  
  forEachDeferred.resolve();
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


  bogart.middleware.parseForm()(request, function(req) {
    t.ok(req, 'req should not be falsey');
    t.type(req.body, 'object', 'Body should be an object');
    t.equal(req.body.a, '1');
  });

  t.plan(3);
  
  process.nextTick(function() {
    forEachDeferred.resolve();
  });
});

test("test method override", function(t) {
  var request = { method: 'POST', env: {} }
    , headers = { 'content-type': 'text/html' }
    , app
    , methodOverride;

  request.body    = { _method: 'PUT' };
  request.headers = headers;

  methodOverride = bogart.middleware.methodOverride();

  Q.when(methodOverride(request, function(req) { return bogart.html('Hello World') }), function() {
    t.equal('PUT', request.method, 'Should change method to PUT');
  }, function(err) {
    console.log('error', err);
    t.end();
  });

  t.plan(1);
});

test("test gzip", function(t) {
  var gzip = bogart.middleware.gzip()
    , appPromise;
  
  appPromise = gzip(mockRequest('/'), function(req) { return bogart.html('Hello World'); });

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

  var gzip = bogart.middleware.gzip();

  Q.when(gzip(mockRequest('/'), function(req) {
    return {
      status: 200,
      headers: { 'content-type': 'text/html' },
      body: [ 'Hello World' ]
    };
  }), function(resp) {
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
  var error = bogart.middleware.error()
    , app = function(req) { throw new Error('intentional'); };
  
  Q.when(error(mockRequest('/'), app), function(resp) {
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
    , request = mockRequest('/')
    , foo
    , cookieStr
    , flash;
  

  flash = bogart.middleware.flash();

  app = function(req) {
    req.flash("foo", "bar");

    foo = req.flash("foo");
    return {
      status: 200,
      body: [],
    }
  };

  Q.when(flash(request, app), function(resp) {
    initialResp = resp;
    cookieStr = initialResp.headers["Set-Cookie"].join("").replace(/;$/, "");

    // the first attempt to retrieve "foo" should be undefined
    t.equal(typeof foo, 'undefined', 'Foo should be undefined');

    request.headers.cookie = cookieStr;
    Q.when(flash(request, app), function() {
      t.equal(foo, 'bar', 'foo should equal bar');
    });
  });

  t.plan(2);
});

test("test error middleware has default response when promise is rejected", function(t) {
  var error = new bogart.middleware.error()
    , app = function(req) { return bogart.q.reject('rejected'); };

  Q.when(error(mockRequest('/'), app), function(resp) {
    t.ok(resp, 'Response should not be falsey');
    t.equal(resp.status, 500);
    t.equal(resp.headers['content-type'], 'text/html', 'Content-Type should be text/html');
  });

  t.plan(3);
});

test("test parted json", function(t) {
  var request = null
    , parted = new bogart.middleware.Parted(function(req) { request = req; return {}; });

  bogart.middleware.parted({
    method: 'POST',
    env: {},
    headers: { 'content-type': 'application/json' },
    body: [ '{ "hello": "world" }' ]
  }, function(req) {
    t.ok(req, 'Request should not be falsey');
    t.type(req.body, 'object', 'Request body should be an object');
    t.equal(req.body.hello, 'world', 'req.body.hello should equal "world"');
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

  parted = bogart.middleware.parted();
  
  parted({
    method: 'POST',
    env: {},
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body
  }, function(req) {
    t.ok(req, 'Request should not be falsey');
    t.ok(req.body, 'Body should not be falsey');
    t.ok(req.body.hello, 'Hello should not be falsey');
    t.equal(req.body.hello.length, 2);
    t.end();
  });

  process.nextTick(function() {
    bodyDefer.resolve();
  });
});

test("test parted multipart", function(t) {
  var parted = bogart.middleware.parted();

  process.nextTick(function() {
    parted(multipartRequest(100, 'chrome'), function(req) {
      t.ok(!!req.body);
      t.ok(!!req.body.content, 'No file path');
    });
  });

  t.plan(2);
});

test("test session", function(t) {
  var app
    , headers = { 'content-type': 'text/plain' }
    , request = { headers: headers, body:[] }
    , values = []
    , firstRequest = true
    , sessionMiddleware;
  
  sessionMiddleware = bogart.middleware.session();

  app = function(req) {
    if(firstRequest) {
      req.session("foo", "bar");
      firstRequest = false;
    }

    values.push(req.session("foo"));

    return {
      status: 200,
      body: [],
    }
  };

  Q.when(sessionMiddleware(request, app), function(initialResp) {
    var cookieStr = initialResp.headers["Set-Cookie"].join("").replace(/;$/, "");

    request.headers.cookie = cookieStr;

    Q.when(sessionMiddleware(request, app), function(resp) {
      t.equal(values.length, 2);
      values.forEach(function(val) {
        t.ok(val, 'bar');
      });
    });
  });
  
  t.plan(3);
});

test("test validate response", function(t) {
  bogart.middleware.validateResponse(mockRequest('/'), function(req) {
    return null;
  }).then(null, function(err) {
    t.equal(err, 'Response must be an object.');
  });

  bogart.middleware.validateResponse(mockRequest('/'), function(req) {
    return {
      status: 200,
      headers: {}
    };
  }).then(null, function(err) {
    t.equal(err, 'Response must have a body property.');
  });

  bogart.middleware.validateResponse(mockRequest('/'), function(req) {
    return {
      status: 200,
      headers: {},
      body: {}
    };
  }).then(null, function(err) {
    t.equal(err, 'Response body must have a forEach method.');
  });

  bogart.middleware.validateResponse(mockRequest('/'), function(req) {
    return {
      status: 200,
      headers: {},
      body: {
        forEach: 'not a function'
      }
    };
  }).then(null, function(err) {
    t.equal(err, 'Response body has a forEach method but the forEach method is not a function.');
  });

  bogart.middleware.validateResponse(mockRequest('/'), function(req) {
    return {
      headers: {},
      body: []
    };
  }).then(null, function(err) {
    t.equal(err, 'Response must have a status property.');
  });

  bogart.middleware.validateResponse(mockRequest('/'), function(req) {
    return {
      status: '200',
      body: [],
      headers: {}
    };
  }).then(null, function(err) {
    t.equal(err, 'Response has a status property but the status property must be a number.');
  });

  t.plan(6);
});

test("test bodyAdapter adapts Stream", function(t) {
  var Stream = require('stream').Stream
    , req    = mockRequest('/');

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

  Q.when(bogart.middleware.bodyAdapter(req, function(req) {
    return new TestReadStream('hello', ' ', 'world');
  }), function(resp) {
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
