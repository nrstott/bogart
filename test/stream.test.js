var bogart        = require('../lib/bogart')
  , test          = require('tap').test
  , plan          = require('tap').plan
  , Q             = require('promised-io/lib/promise')
  , fs            = require('fs')
  , ForEachStream = require('../lib/forEachStream')
  , zlib          = require('zlib');

test("test foreachstream pipe to file stream", function(t) {
  var source   = ['Hello ','World']
    , stream   = new ForEachStream(source)
    , filename = 'hello-world.txt';
  
  stream.pipe(fs.createWriteStream(filename));

  stream.on('end', function() {
    var stat = fs.statSync(filename);

    t.ok(stat);
    t.ok(stat.isFile(), 'Should be a file');
    t.equal('Hello World', fs.readFileSync(filename, 'utf8'));
    t.end();
  });
});

test("test foreachstream pipe to deflateStream", function(t) {
  var source    = [ 'Hello', ' ', 'World' ]
    , srcStream = new ForEachStream(source)
    , stream    = zlib.createDeflateRaw()
    , filename  = 'hello-world.dat';

  srcStream.pipe(stream).pipe(fs.createWriteStream(filename));

  stream.on('end', function() {
    var stat = fs.statSync(filename);

    t.ok(stat);
    t.ok(stat.isFile(), 'Should be a file');

    process.nextTick(function() {
      var readStream = fs.createReadStream(filename)
        , inflateStream = zlib.createInflateRaw()
        , buf = new Buffer(0);

      readStream.pipe(inflateStream);

      inflateStream.on('data', function(data) {
        var oldBuf = buf;

        buf = new Buffer(oldBuf.length + data.length);
        oldBuf.copy(buf, 0, 0);
        data.copy(buf, oldBuf.length, 0);
      });

      inflateStream.on('error', function(err) {
        t.fail(err);
      });

      inflateStream.on('end', function() {
        t.equal(buf.toString('utf-8'), 'Hello World');
        t.end();
      });
    });
  });
});

exports["test pump ForEachStrean to file stream"] = function(beforeExit) {
  var seed     = ['Hello',' ','World'].map(function(x) { return new Buffer(x); })
    , filename = 'forEachableToFileStream.txt'
    , src      = new ForEachStream(seed)
    , dest     = fs.createWriteStream(filename);
  
  bogart.pump(src, dest);

  src.on('end', function() {
    var stat = fs.statSync(filename);

    t.ok(stat.isFile());
    t.equal('Hello World', fs.readFileSync(filename, 'utf-8'));
    t.end();
  });
};

exports["test pump forEachable to file stream"] = function(beforeExit) {
  var src      = ['Hello',' ','World']
    , filename = 'forEachableToFileStream.txt'
    , dest     = fs.createWriteStream(filename)
    , destEnd  = dest.end;

  dest.end = function() {
    destEnd.apply(dest, Array.prototype.slice.call(arguments));

    var stat = fs.statSync(filename);

    t.ok(stat.isFile());
    t.equal('Hello World', fs.readFileSync(filename, 'utf-8'));
    t.end();
  };    
  
  bogart.pump(src, dest);
};