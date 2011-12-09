var bogart    = require('../lib/bogart')
  , Q         = require("promised-io/lib/promise")
  , assert    = require('assert')
  , path      = require('path')
  , fs     = require('fs')
  , security  = require("../lib/security")
  , util      = require('util');

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
    assert.isNotNull(response, 'Responses should not be null');
    assert.equal(200, response.status);
    assert.equal('text/html', response.headers['content-type']);
  });
};

exports["test error middleware has default response when error is thrown"] = function(beforeExit) {
  var response = null
    , app      = new bogart.middleware.Error(function(req) { throw new Error('intentional'); });
  
  Q.when(app({ method: 'GET', env: {}, headers: {}, pathInfo: '/' }), function(resp) {
    response = resp;
  });

  beforeExit(function() {
    assert.isNotNull(response);
    assert.equal(500, response.status);
    assert.equal('text/html', response.headers['content-type']);
  });
};

exports["test flash"] = function(beforeExit) {
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
    assert.isUndefined(foo);

    request.headers.cookie = cookieStr;
    var secondResp = app(request);
  });
  
  beforeExit(function() {
    assert.eql(foo, "bar");
  });
};


exports["test error middleware has default response when promise is rejected"] = function(beforeExit) {
  var response = null
    , app      = new bogart.middleware.Error(function(req) { return require('q').reject('rejected'); });
  
  Q.when(app({ method: 'GET', env: {}, headers: {}, pathInfo: '/' }), function(resp) {
    response = resp;
  });

  beforeExit(function() {
    assert.isNotNull(response);
    assert.equal(500, response.status);
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

exports["test parted form"] = function(beforeExit) {
  var request     = null
    , parted      = new bogart.middleware.Parted(function(req) { request = req; return {}; })
    , body        = {}
    , bodyDefer   = require('q').defer();
  
  body.forEach = function(callback) {
    callback('hello=one&hello=two');

    return bodyDefer.promise;
  };
  
  response = parted({
    method: 'POST',
    env: {},
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body
  });

  bodyDefer.resolve();

  beforeExit(function() {
    assert.isNotNull(request);
    assert.ok(!!request.body);
    assert.ok(!!request.body.hello);
    assert.equal(2, request.body.hello.length);
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


exports["test session"] = function(beforeExit) {
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

  var initialResp = app(request);
  var cookieStr = initialResp.headers["Set-Cookie"].join("").replace(/;$/, "");

  request.headers.cookie = cookieStr;
  var secondResp = app(request);

  beforeExit(function() {
    assert.equal(values.length, 2);
    values.forEach(function(val) {
      assert.equal(val, "bar");
    })
  });

};

exports["test validate response"] = function(beforeExit) {
  var noResponse, noBody, notForEachable, forEachNotFunction, noStatus, statusNotNumber;
  
  bogart.middleware.validateResponse(function(req) {
    return null;
  })().then(bogart.noop, function(err) {
    noResponse = err;
  });

  bogart.middleware.validateResponse(function(req) {
    return {
      status: 200,
      headers: {}
    };
  })().then(bogart.noop, function(err) {
    noBody = err;
  });

  bogart.middleware.validateResponse(function(req) {
    return {
      status: 200,
      headers: {},
      body: {}
    };
  })().then(bogart.noop, function(err) {
    notForEachable = err;
  });

  bogart.middleware.validateResponse(function(req) {
    return {
      status: 200,
      headers: {},
      body: {
        forEach: 'not a function'
      }
    };
  })().then(bogart.noop, function(err) {
    forEachNotFunction = err;
  });

  bogart.middleware.validateResponse(function(req) {
    return {
      headers: {},
      body: []
    };
  })().then(bogart.noop, function(err) {
    noStatus = err;
  });

  bogart.middleware.validateResponse(function(req) {
    return {
      status: '200',
      body: [],
      headers: {}
    };
  })().then(bogart.noop, function(err) {
    statusNotNumber = err;
  });

  beforeExit(function() {
    assert.equal('Response must be an object.', noResponse);
    assert.equal('Response must have a body property.', noBody);
    assert.equal('Response body must have a forEach method.', notForEachable);
    assert.equal('Response body has a forEach method but the forEach method is not a function.', forEachNotFunction);
    assert.equal('Response must have a status property.', noStatus);
    assert.equal('Response has a status property but the status property must be a number.', statusNotNumber);
  });
};

exports["test bodyAdapter adapts Stream"] = function(beforeExit) {
  var Stream = require('stream').Stream
    , response;

  function TestReadStream() {
    Stream.call(this);

    var args = Array.prototype.slice.call(arguments)
      , self = this;

    process.nextTick(function emitData() {
      var x = args.pop();
      if (!x) { return; }

      self.emit('data', x);

      process.nextTick(function() {
        emitData();
      });
    });

    this.readable = true;
  }

  util.inherits(TestReadStream, Stream);

  var streamAdapter = bogart.middleware.bodyAdapter(function(req) {
    return new TestReadStream('hello', ' ', 'world');
  });

  Q.when(streamAdapter(), function(resp) {
    response = resp;
  });

  beforeExit(function() {
    assert.ok(response);
    assert.ok(response.body);
    assert.ok(response.body.forEach);

    var str = '';
    response.body.forEach(function(x) {
      str += x;
    });

    assert.equal('hello world', str);
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
