var
  bogart = require('../lib/bogart'),
  assert = require('assert'),
  Q      = require('promised-io/promise'),
  when   = Q.when;

exports['test json'] = {
  "test should have status 200": function() {
    var resp = bogart.json({});
    
    assert.equal(200, resp.status);
  },
  "should have status 403": function() {
    var
      status = 403,
      resp = bogart.json({}, { status: status });
    
    assert.equal(status, resp.status);
  },
  "test should have body": function() {
    var
      bodyObj = { hello: "world" },
      resp = bogart.json(bodyObj);
    
    assert.equal(JSON.stringify(bodyObj), resp.body.join());
  }
};

exports['test error'] = {
  "test should have status 500": function() {
    var resp = bogart.error();
    
    assert.equal(500, resp.status);
  },
  "test should have status 403": function() {
    var resp = bogart.error("", { status: 403 });
    
    assert.equal(403, resp.status);
  }
};

exports['test html'] = {
  "test should have status 200": function() {
    var resp = bogart.html();
    
    assert.equal(200, resp.status);
  },
  "test should have status 404": function() {
    var resp = bogart.html("", { status: 404 });
    
    assert.equal(404, resp.status);
  },
  "test should have HTML": function() {
    var
      str = "Hello World",
      resp = bogart.html(str);
    
    assert.equal(str, resp.body.join());
  },
  "test should be text/html": function() {
    var
      resp = bogart.html();
    
    assert.equal("text/html", resp.headers["content-type"])
  },
  "test should have content-length 5": function() {
    var
      str = "hello",
      resp = bogart.html(str);
    
    assert.equal(5, resp.headers["content-length"]);
  }
}

if(require.main == module) {
  require("patr/runner").run(exports);
}
