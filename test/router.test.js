var
  bogart = require('../lib/bogart'),
  assert = require('assert'),
  Q      = require('promised-io/promise'),
  when   = Q.when,
  jsgi   = require('jsgi'),
  rootRequest = {
    headers: {},
    pathInfo: '/',
    method: 'GET',
    jsgi: { version: [0, 3] },
    env: {}
  };

exports['test should call notFoundApp'] = function() {
  var
    called = false,
    notFoundApp = function(req) {
      called = true;
      return { status: 409, body: [ '' ] };
    },
    router = bogart.router(function() {}, notFoundApp),
    respPromise = router(rootRequest);
    
  return when(respPromise, function(resp) {
    assert.equal(409, resp.status);
    assert.ok(called);
  });
};

exports['test should have default notFoundApp behavior of returning 404'] = function() {
  var
    router = bogart.router(function(){}),
    respPromise = router(rootRequest);
  
  return when(respPromise, function(resp) {
    assert.equal(404, resp.status);
  });
};

if(require.main == module) {
  require("patr/runner").run(exports);
}
