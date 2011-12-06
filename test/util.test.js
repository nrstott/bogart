var bogart = require('../lib/bogart'),
    Q = require("promised-io/lib/promise"),
    assert = require('assert'),
    path = require('path'),
    security = require("../lib/security");

exports["security"] = function(beforeExit) {
    var key = "667016c4-1a2e-11e1-8db4-836d74549718";
    var key2 = "THIS is a Secret -- key == C!@#$%^&*())_%3D%2F";
    var key3 = "0ce05d12-1a33-11e1-a436-0019e34411d1";
    var plain = "this is a very long string of text with random characters {}[[]\!@#$%^&*()_+!@#$%^&*()_+%3D%44%5Z,this is a very long string of text with random characters {}[[]\!@#$%^&*()_+!@#$%^&*()_+%3D%44%5Z,this is a very long string of text with random characters {}[[]\!@#$%^&*()_+!@#$%^&*()_+%3D%44%5Z,this is a very long string of text with random characters {}[[]\!@#$%^&*()_+!@#$%^&*()_+%3D%44%5Z";

    // test default key
    var enc1 = security.encrypt(plain);
    var dec1 = security.decrypt(enc1);
    assert.equal(dec1, plain);

    // test provided key 1
    var enc2 = security.encrypt(plain, key2);
    var dec2 = security.decrypt(enc2, key2);
    assert.equal(dec2, plain);

    // test uuid key
    var enc3 = security.encrypt(plain, key3);
    var dec3 = security.decrypt(enc3, key3);
    assert.equal(dec3, plain);

    // test uri encoding, just to be safe
    var enc4 = encodeURIComponent(security.encrypt(plain, key2));
    var dec4 = security.decrypt(decodeURIComponent(enc4), key2);
    assert.equal(dec4, plain);
};

exports['bogart.promisify handles success'] = function(beforeExit) {
  var p, asyncFn, actualVal, expectedVal = 1;

  asyncFn = function(cb) {
    process.nextTick(function() {
      cb(null, expectedVal);
    });
  };

  p = bogart.promisify(asyncFn)();
  p.then(function(val) {
    actualVal = val;
  });

  beforeExit(function() {
    assert.equal(expectedVal, actualVal);
  });
};

exports['bogart.promisify handles rejection'] = function(beforeExit) {
  var p, asyncFn, expected, actual;

  asyncFn = function(cb) {
    process.nextTick(function() {
      cb(expected);
    });
  };

  p = bogart.promisify(asyncFn)();
  p.then(bogart.noop, function(err) {
    actual = err;
  });

  beforeExit(function() {
    assert.equal(expected, actual);
  });
};