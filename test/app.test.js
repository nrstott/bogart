var bogart = require('../lib/bogart')
  , Q      = bogart.q
  , when   = Q.when
  , test   = require('tap').test
  , plan   = require('tap').plan
  , sinon  = require('sinon');

test('given a new app with a router to be started with no parameters', function(t) {
  var app = bogart.app();

  t.test('should not be started', function(t) {
    t.equal(app.started, false);
    t.plan(1);
  });

  t.test('should have use method', function(t) {
    t.ok(typeof app.use === 'function');
    t.plan(1);
  });

  t.test('should raise afterAddMiddleware with correct parameter', function(t) {
    var router = bogart.router()
      , appParam
      , middlewareParam;

    app.on('afterAddMiddleware', function(app, middleware) {
      appParam = app;
      middlewareParam = middleware;
    });

    app.use(router);

    t.equal(appParam, app);
    t.equal(middlewareParam, router);

    t.plan(2);
  });

  t.test('starting the app with no parameters', function(t) {
    var server = {}
      , jsgiOptsFromSpy
      , bogartStartSpy = sinon.stub(bogart, 'start', function(jsgiApp, opts) {
        jsgiOptsFromSpy = opts;
        return server;
      });

    app.start();

    t.test('should be started', function(t) {
      t.equal(app.started, true);
      t.plan(1);
    });

    t.test('should have started with correct jsgi options parameter', function(t) {
      t.equal(jsgiOptsFromSpy.port, 8080);
      t.equal(jsgiOptsFromSpy.host, '127.0.0.1');
      t.plan(2);
    });

    bogart.start.restore();
  });
});

test('given a new app with a router to be started with object parameter', function(t) {
  var app = bogart.app();

  t.equal(app.started, false);

  t.test('should raise afterAddMiddleware with correct parameter', function(t) {
    var router = bogart.router()
      , appParam
      , middlewareParam;

    app.on('afterAddMiddleware', function(app, middleware) {
      appParam = app;
      middlewareParam = middleware;
    });

    app.use(router);

    t.equal(appParam, app);
    t.equal(middlewareParam, router);

    t.end();
  });

  t.test('starting the app', function(t) {
    var opts = { port: 123, host: 'localhost', somethingElse: 'anotherOption' }
      , server = {}
      , jsgiOptsFromSpy
      , bogartStartSpy = sinon.stub(bogart, 'start', function(jsgiApp, opts) {
          jsgiOptsFromSpy = opts;
          return server;
        });

    app.start(opts);

    t.equal(app.started, true);

    t.test('should have started with correct jsgi options parameter', function(t) {
      t.equal(jsgiOptsFromSpy.port, 123);
      t.equal(jsgiOptsFromSpy.host, 'localhost');
      t.equal(jsgiOptsFromSpy.somethingElse, 'anotherOption');
      t.end();
    });

    t.end();
  });
});
