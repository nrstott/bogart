var bogart        = require('../lib/bogart')
  , Q             = require('promised-io/lib/promise')
  , assert        = require('assert')
  , fs            = require('fs')
  , ForEachStream = require('../lib/forEachStream')
  , deflate       = require('deflate');

exports["test foreachstream pipe to file stream"] = function(beforeExit) {
  var source   = ['Hello ','World']
    , stream   = new ForEachStream(source)
    , filename = 'hello-world.txt';
  
  stream.pipe(fs.createWriteStream(filename));

  beforeExit(function() {
    var stat = fs.statSync(filename);

    assert.isNotNull(stat);
    assert.ok(stat.isFile(), 'Should be a file');

    assert.equal('Hello World', fs.readFileSync(filename, 'utf8'));
  });
};

exports["test foreachstream pipe to deflateStream"] = function(beforeExit) {
  var source   = ['Hello',' ','World'].map(function(x) { return new Buffer(x); })
    , stream   = deflate.createDeflateStream(new ForEachStream(source))
    , filename = 'hello-world.dat';

  stream.pipe(fs.createWriteStream(filename));

  beforeExit(function() {
    var stat = fs.statSync(filename);

    assert.isNotNull(stat);
    assert.ok(stat.isFile(), 'Should be a file');

    assert.equal('Hello World', deflate.inflate(fs.readFileSync(filename)).toString('utf8'));
  });
};

exports["test pump ForEachStrean to file stream"] = function(beforeExit) {
  var seed     = ['Hello',' ','World'].map(function(x) { return new Buffer(x); })
    , filename = 'forEachableToFileStream.txt'
    , src      = new ForEachStream(seed)
    , dest     = fs.createWriteStream(filename);
  
  bogart.pump(src, dest);

  beforeExit(function() {
    var stat = fs.statSync(filename);

    assert.ok(stat.isFile());
    assert.equal('Hello World', fs.readFileSync(filename, 'utf-8'));
  });
};

exports["test pump forEachable to file stream"] = function(beforeExit) {
  var src      = ['Hello',' ','World']
    , filename = 'forEachableToFileStream.txt'
    , dest     = fs.createWriteStream(filename);
  
  bogart.pump(src, dest);

  beforeExit(function() {
    var stat = fs.statSync(filename);

    assert.ok(stat.isFile());
    assert.equal('Hello World', fs.readFileSync(filename, 'utf-8'));
  });
};