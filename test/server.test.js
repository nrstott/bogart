var 
  bogart = require('../lib/bogart'),
  Q      = require('promised-io/promise'),
  when   = Q.when,
  assert = require('assert'),
  jsgi   = require('jsgi'),
  rootRequest = {
    headers: {},
    pathInfo: '/',
    method: 'GET',
    jsgi: { version: [0, 3] },
    env: {}
  };;

exports["should have run"] = function() {
  assert.ok(bogart.run);
};

exports["should have middleware"] = function() {
  var server = new bogart.Server(function() {
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
  
  assert.ok(resp.headers);
  assert.equal("xyz", resp.headers["custom-header"]);
};