var bogart      = require('../lib/bogart')
  , q           = require('q')
  , security    = require("../lib/security")
  , util        = require('util')
  , test        = require('tap').test
  , plan        = require('tap').plan
  , mockRequest = require('./helpers').mockRequest;

test('rejects with error "Empty chain" when called with an empty chain', function(t) {
  var branch = bogart.middleware.branch(function(req) {
    t.ok(req, 'Should have request');
  });

  q.when(branch(mockRequest('/')), null, function(err) {
    t.equal(err.message, 'Empty chain');
    t.end();
  }).end();
});

test('should have ifTrue', function(t) {
  var binary = bogart.middleware.branch(function(req) {
    return true;
  });

  t.ok(binary.ifTrue);
  t.end();
});

test('should have ifFalse', function(t) {
  var binary = bogart.middleware.branch(function(req) {
    return true;
  });

  t.ok(binary.ifFalse);
  t.end();
});

test('should follow ifTrue path', function(t) {
  var binary = bogart.middleware.branch(function(req) {
    return true;
  });

  binary.ifTrue(function(req) {
    t.ok(req, 'Followed ifTrue path');
  });

  binary(mockRequest('/'));

  t.plan(1);
});

test('should follow ifFalse path', function(t) {
  var binary = bogart.middleware.branch(function(req) {
    return false;
  });

  binary.ifFalse(function(req) {
    t.ok(req, 'Followed ifFalse path');
  });

  binary(mockRequest('/'));

  t.plan(1);
});