var request = require('../lib/request') 
  , test   = require('tap').test
  , plan   = require('tap').plan;

test('request creation', function(t) {
  var req = request({})
    , keys = Object.keys(req);

  t.notEqual(keys.indexOf('params'), -1, 'should have enumerable `params` property');
  t.notEqual(keys.indexOf('search'), -1, 'should have enumerable `search` property');
  t.notEqual(keys.indexOf('isXMLHttpRequest'), -1, 'should have enumerable `isXMLHttpRequest` property');
  t.end();
});

test('query string parameters', function(t) {
  var jsgiRequest = { queryString: 'a=1&b=abc' }
    , req = request(jsgiRequest);

  t.equal(req.queryString, jsgiRequest.queryString, 'should have correct queryString');

  t.test('search', function(t) {
    var search = req.search;

    t.equal(search.a, '1', 'should have correct `a` parameter');
    t.equal(search.b, 'abc', 'should have correct `b` parameter');
    t.end();
  });

  t.test('params', function(t) {
    t.equal(req.params.a, '1', 'should have correct `a` parameter');
    t.equal(req.params.b, 'abc', 'should have correct `b` parameter');
    t.end();
  });
});

test('route parameters', function(t) {
  var jsgiRequest = {}
    , req = request(jsgiRequest);

  req.routeParams.name = 'Bob';

  t.test('params', function(t) {
    var params = req.params;

    t.equal(params.name, 'Bob', 'should have correct `name` parameter');
    t.end();
  });

  t.test('search', function(t) {
    var search = req.search;

    t.notOk(search.name, 'should not have name');
    t.end();
  });
});