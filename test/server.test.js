var bogart = require('../lib/bogart')
  , q      = require('promised-io/lib/promise')
  , when   = q.when
  , assert = require('assert')
  , jsgi   = require('jsgi')
  , rootRequest = {
    headers: {},
    pathInfo: '/',
    method: 'GET',
    jsgi: { version: [0, 3] },
    env: {}
  };

exports["test should have middleware"] = function(beforeExit) {
  var response = null
    , server = new bogart.build(function() {
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
  
  when(server(rootRequest), function(resp) {
    response = resp;
  });
  
  beforeExit(function() {
    assert.ok(response.headers);
    assert.equal("xyz", response.headers["custom-header"]);
  });
};
