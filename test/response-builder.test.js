var bogart = require('../lib/bogart')
  , assert = require('assert')
  , Q      = require('promised-io/lib/promise')
  , fs     = require('fs')
  , path   = require('path')
  , test   = require('tap').test
  , plan   = require('tap').plan;

function identity(){};
 
test("test ResponseBuilder can be resolved", function(t) {
  var response = new bogart.ResponseBuilder();

  response.then(function() {
    t.ok(true);
  });

  response.resolve();

  t.plan(1);
});

test("test ResponseBuilder can be rejected", function(t) {
  var response = new bogart.ResponseBuilder();
  
  response.then(null, function() {
    t.ok(true);
  });

  response.reject();

  t.plan(1);
});

test("test ResponseBuilder send string", function(t) {
  var response = new bogart.ResponseBuilder()
    , msg      = 'Hello World'
    , written  = '';

  response.send(msg);

  response.then(function(resp) {
    return resp.body.forEach(function(data) {
      written += data;
    });
  }).then(function() {
    t.equal(written, msg);
  });

  response.end();

  t.plan(1);
});

exports["test ResponseBuilder send buffer"] = function(t) {
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
  }).then(function() {
    t.equal(written, msg);
  });

  t.plan(1);
};

test("test ResponseBuilder send binary", function(t) {
  var response    = new bogart.ResponseBuilder()
    , filePath    = path.join(__dirname, 'fixtures', 'test.jpg')
    , stat        = fs.statSync(filePath)
    , fileContent = null
    , written     = new Buffer(stat.size);
  
  fs.readFile(filePath, 'binary', function(err, content) {
    if (err) {
      t.fail(err);
      return;
    }
    fileContent = content;
    response.send(content);
    response.end();
  });

  response.then(function(resp) {
    return resp.body.forEach(function(chunk) {
      written.write(chunk, 'binary');
    });
  }).then(function() {
    t.ok(fileContent !== null, 'fileContent should not be null');
    t.equal(written.toString('binary'), fileContent);
  });

  t.plan(2);
});
