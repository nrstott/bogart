bogart = require '../lib/bogart'
q = bogart.q
fs = require 'fs'
Readable = require('stream').Readable
ForEachStream = require '../lib/forEachStream'
zlib = require 'zlib'

describe 'ForEachStream pipe to file stream', ->
  stat = null

  beforeEach ->
    stat = q.defer()

    source = [ 'Hello', 'World' ]
    stream = new ForEachStream source
    fileName = 'hello-world.txt'
    writeStream = fs.createWriteStream fileName

    stream.pipe writeStream

    stream.on 'end', ->
      stat.resolve(fs.statSync fileName)

  it 'should have created file', (done) ->
    q.when stat.promise, (stat) ->
      expect(stat.isFile()).toBe true
      done()

describe 'ForEachStream pipe to deflate stream', ->
  stat = null
  bufferInflated = null

  beforeEach ->
    statDeferred = q.defer()
    bufferInflatedDeferred = q.defer()

    stat = statDeferred.promise
    bufferInflated = bufferInflatedDeferred.promise

    source = [ 'Hello', ' ', 'World' ]
    srcStream = new ForEachStream source
    stream = zlib.createDeflateRaw()
    fileName = 'hello-world.dat'

    srcStream.pipe(stream).pipe(fs.createWriteStream(fileName))

    stream.on 'end', ->
      statDeferred.resolve fs.statSync(fileName)

      process.nextTick ->
        readStream = fs.createReadStream fileName
        inflateStream = zlib.createInflateRaw()
        buffer = new Buffer 0

        readStream.pipe inflateStream

        inflateStream.on 'data', (data) ->
          oldBuffer = buffer

          buffer = new Buffer(oldBuffer.length + data.length)
          oldBuffer.copy(buffer, 0, 0)
          data.copy(buffer, oldBuffer.length, 0)

        inflateStream.on 'error', (err) =>
          this.fail err

        inflateStream.on 'end', ->
          bufferInflatedDeferred.resolve buffer.toString('utf-8')

  it 'should have correct inflated buffer', (done) ->
    q.when bufferInflated, (str) ->
      expect(str).toBe 'Hello World'
      done()

  it 'should have created file', (done) ->
    q.when stat, (stat) ->
      expect(stat.isFile()).toBe true
      done()

describe 'pump ForEachStream to file stream', ->
  ended = null
  fileName = null

  beforeEach ->
    seed = [ 'Hello', ' ', 'World' ].map (x) ->
      new Buffer x

    fileName = 'forEachableToFileStream.txt'
    
    src = new ForEachStream seed

    dest = fs.createWriteStream fileName

    ended = bogart.pump src, dest

  it 'should create file', (done) ->
    q.when ended, ->
      expect(fs.statSync(fileName).isFile()).toBe true
      done()

  it 'should have correct file content', (done) ->
    q.when ended, ->
      expect(fs.readFileSync(fileName, 'utf-8')).toBe 'Hello World'
      done()
