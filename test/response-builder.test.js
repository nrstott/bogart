var bogart = require('../lib/bogart')
  , assert = require('assert')
  , Q      = require('promised-io/lib/promise');

function identity(){};
 
exports["test ResponseBuilder can be resolved"] = function(beforeExit) {
  var resolved = false
    , response = new bogart.ResponseBuilder();

  response.then(function() {
    resolved = true;
  });

  response.resolve();

  beforeExit(function() {
    assert.ok(resolved, 'Should have resolved');
  });
};

exports["test ResponseBuilder can be rejected"] = function(beforeExit) {
  var rejected = false
    ,  response = new bogart.ResponseBuilder();
  
  response.then(identity, function() {
    rejected = true;
  });

  response.reject();

  beforeExit(function() {
    assert.ok(rejected, 'Should have rejected');
  });
};

exports["test ResponseBuilder send string"] = function(beforeExit) {
  var response = new bogart.ResponseBuilder()
    , msg      = 'Hello World'
    , written  = '';

  response.send(msg);

  response.then(function(resp) {
    return resp.body.forEach(function(data) {
      written += data;
    });
  });

  response.end();

  beforeExit(function() {
    assert.equal(msg, written);
  });
};

exports["test ResponseBuilder send buffer"] = function(beforeExit) {
  var response = new bogart.ResponseBuilder()
    , msg      = 'Hello World'
    , buf      = new Buffer(msg.length)
    , written  = '';
  
  buf.write(msg);
  response.send(buf);
  response.end();

  response.then(function(resp) {
  	return resp.body.forEach(function(data) {
  		written += data;
  	});
  });

  beforeExit(function() {
  	assert.equal(msg, written);
  });
};
