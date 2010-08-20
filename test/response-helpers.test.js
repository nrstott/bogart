var
  bogart = require('../lib/bogart'),
  assert = require('assert'),
  Q      = require('promised-io/promise'),
  when   = Q.when;

exports.json = {
  "should have status 200": function() {
    var resp = bogart.json({});
    
    assert.equal(200, resp.status);
  },
  "should have status 403": function() {
    var
      status = 403,
      resp = bogart.json({}, { status: status });
    
    assert.equal(status, resp.status);
  },
  "should have body": function() {
    var
      bodyObj = { hello: "world" },
      resp = bogart.json(bodyObj);
    
    assert.equal(JSON.stringify(bodyObj), resp.body.join());
  }
};

if(require.main == module) {
  require("patr/runner").run(exports);
}