var bogart    = require('../lib/bogart')
  , q         = require('promised-io/lib/promise')
  , test      = require('tap').test
  , plan      = require('tap').plan;

test('should have use method', function(t) {
  var chain = bogart.chain();

  t.type(chain.use, 'function');
  t.end();
});

test('should use middleware', function(t) {
  var chain = bogart.chain();
  chain.use(function(req, next) {
    req.hello = 'world';

    return next(req);
  });

  chain({
    pathname: '/'
  }, function(req) {
    t.equal(req.hello, 'world');
  });

  t.plan(1);
});
