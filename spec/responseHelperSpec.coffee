bogart = require '../lib/bogart'
q = bogart.q
path = require 'path'
fs = require 'fs'

describe 'json', ->
  it 'should have default status of 200', ->
    expect(bogart.json({}).status).toBe 200

  it 'given status should override status', ->
    expect(bogart.json({}, { status: 403 }).status).toBe 403

  describe 'given object', ->
    res = null
    obj = null

    beforeEach ->
      obj = { hello: 'world' }

      res = bogart.json obj

    it 'should have correct body', ->
      expect(res.body.join()).toBe JSON.stringify(obj)


describe 'cors', ->
  it 'should have default status of 200', ->
    expect(bogart.cors({}).status).toBe 200

  it 'given status should override status', ->
    expect(bogart.cors({}, { status: 403 }).status).toBe 403

  describe 'given object', ->
    res = null
    body = null

    beforeEach ->
      body = { hello: 'world' }

      res = bogart.cors body

    it 'should have correct body', ->
      expect(res.body.join()).toBe JSON.stringify(body)
    it 'should have correct headers', ->
      expect(res.headers['Access-Control-Allow-Origin']).toBe '*'
      expect(res.headers['Access-Control-Allow-Methods']).toBe 'GET,PUT,POST,DELETE'
      expect(res.headers['Access-Control-Allow-Headers']).toBe 'x-requested-with,*'
    it 'given headers should override the default headers', ->
      headers = {'Access-Control-Allow-Origin': 'http://whiteboard-it.com', 'Content-Type': 'text/plain'}
      expect(bogart.cors({a:'b'},{headers: headers}).headers['Access-Control-Allow-Origin']).toBe 'http://whiteboard-it.com'
      expect(bogart.cors({a:'b'},{headers: headers}).headers['Content-Type']).toBe 'text/plain'

describe 'error', ->
  it 'should have default status of 500', ->
    expect(bogart.error().status).toBe 500

  it 'should override status', ->
    expect(bogart.error('', { status: 403 }).status).toBe 403


describe 'html', ->
  it 'should have default status of 200', ->
    expect(bogart.html('hello').status).toBe 200

  it 'should override status', ->
    expect(bogart.html('hello', { status: 404 }).status).toBe 404

  describe 'given html string', ->
    res = null
    str = null

    beforeEach ->
      str = '<html><body><h1>Hello</h1></body></html>'
      res = bogart.html str

    it 'should have correct content-type', ->
      expect(res.headers['content-type']).toBe 'text/html'

    it 'should have correct content-length', ->
      expect(res.headers['content-length']).toBe Buffer.byteLength(str, 'utf-8')

    it 'should have correct body', ->
      expect(res.body.join()).toBe str


describe 'pipe', ->
  res = null

  beforeEach ->
    readStream = fs.createReadStream path.join(__dirname, 'fixtures', 'text.txt')
    res = bogart.pipe readStream

  it 'should have correct body', (done) ->
    q.when(res, (res) ->
      written = ''

      forEachFinished = res.body.forEach (data) ->
        written += data

      q.when forEachFinished, ->
        expect(written).toBe 'Hello World'
        done()
    ).fail (err) =>
      this.fail err
      done()

describe 'pipe given forEachable', ->
  forEachable = null
  deferred = null
  msg = null
  res = null

  beforeEach ->
    msg = 'Hello World'

    deferred = q.defer()

    forEachable = {
      forEach: (callback) ->
        callback msg
        deferred.promise
    }

    setTimeout ->
      deferred.resolve()

    res = bogart.pipe forEachable

  it 'should have correct body', (done) ->
    q.when(res, (res) ->
      written = ''

      forEachFinished = res.body.forEach (data) ->
        written += data

      q.when forEachFinished, ->
        expect(written).toBe msg
        done()

    ).fail (err) =>
      this.fail err
      done()

describe 'redirect given options', ->
  res = null
  opts = null

  beforeEach ->
    opts = { hello: 'world' }
    res = bogart.redirect '/', opts

  it 'should have correctly merged `hello` value', ->
    expect(res.hello).toBe opts.hello

describe 'redirect given headers', ->
  res = null
  headers = null

  beforeEach ->
    headers = { hello: 'world' }

    res = bogart.redirect '/', { headers: headers }

  it 'should have correct location header', ->
    expect(res.headers.location).toBe '/'

  it 'should have correct `hello` header', ->
    expect(res.headers.hello).toBe headers.hello

