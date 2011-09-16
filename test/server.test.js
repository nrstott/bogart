var bogart = require('../lib/bogart')
  , Q      = require('promised-io/lib/promise')
  , when   = Q.when
  , assert = require('assert')
  , rootRequest = {
    headers: {},
    pathInfo: '/',
    method: 'GET',
    jsgi: { version: [0, 3] },
    env: {}
  };

exports["test should have middleware"] = function() {
  var server = new bogart.build(function() {
    this.use(function(nextApp) {
      return function(req) {
        return when(nextApp(req), function(resp) {
          resp.headers["custom-header"] = "xyz";
          return resp;
        });
      }
    });
    
    this.use(bogart.router, function(get) {
      get("/", function() {
        return {
          status: 200,
          headers: {},
          body: []
        }
      });
    });
  });
  
  var resp = server(rootRequest);
  
  return when(resp, function(resp) {
    assert.ok(resp.headers);
    assert.equal("xyz", resp.headers["custom-header"]);    
  });
};
