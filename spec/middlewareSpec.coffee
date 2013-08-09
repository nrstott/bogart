bogart = require '../lib/bogart'
q = bogart.q
mockRequest = require './helpers/JsgiRequestHelper'

describe 'middleware helper', ->
  testMiddleware = null
  req = null
  next = null
  handler = null

  beforeEach ->
    handler = jasmine.createSpy()
    
    testMiddleware = bogart.middleware handler
    req = mockRequest.root()
    next = jasmine.createSpy()

    testMiddleware(next)(req)

  it 'should be a function', ->
    expect(typeof testMiddleware).toBe 'function'

  it 'should call handler with correct request', ->
    expect(handler).toHaveBeenCalledWith req, jasmine.any(Function)

  it 'should call handler with correct nextApp', ->
    expect(handler).toHaveBeenCalledWith jasmine.any(Object), next


describe 'parse json', ->
  parseJsonMiddleware = null
  body = null
  jsgiRequest = null
  reqParam = null
  res = null

  beforeEach ->
    forEachDeferred = q.defer()
    headers = { 'content-type': 'application/json' }

    body = {
      forEach: (callback) ->
        callback(JSON.stringify { a: '1' })
        forEachDeferred.promise
    }

    request = { headers: headers, body: body }

    parseJsonMiddleware = bogart.middleware.parseJson((req) ->
      reqParam = req
    )

    res = parseJsonMiddleware(request)

    process.nextTick(() ->
      forEachDeferred.resolve()
    )

  it 'should have passed request to nextApp', (done) ->
    q.when(res, () ->
      expect(reqParam).toBeDefined()
      done()
    , (err) =>
      this.fail err
      done()
    )
  
  it 'should have correct body', (done) ->
    q.when(res, () ->
      expect(reqParam.body.a).toBe '1'
      done()
    , (err) =>
      this.fail err
      done()
    )

describe 'test parse form', ->
  forEachDeferred = null
  parseFormMiddleware = null
  echoApp = null
  res = null
  reqParamInNextApp = null

  beforeEach ->
    echoApp = () ->
      (req) ->
        reqParamInNextApp = req
        { body: [], headers: {}, status: 200 }

    forEachDeferred = q.defer()

    parseFormMiddleware = bogart.middleware.parseForm echoApp()

    jsgiRequest = {
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: {
        forEach: (callback) ->
          callback('a=1')
      }
    }

    res = parseFormMiddleware jsgiRequest

    process.nextTick(() ->
      forEachDeferred.resolve()
    )

  it 'should pass correct req to nextApp', (done) ->
    q.when(res, () ->
      expect(reqParamInNextApp.body.a).toBe '1'
      done()
    , (err) =>
      this.fail(err)
      done()
    )

describe 'method override', ->
  methodOverrideMiddleware = null
  jsgiRequest = null
  res = null

  beforeEach ->
    methodOverrideMiddleware = bogart.middleware.methodOverride((req) ->
      {}
    )

    headers = { 'content-type': 'text/html' }
    jsgiRequest = { method: 'post', env: {}, body: { _method: 'put' }, headers: headers }

    res = methodOverrideMiddleware jsgiRequest

  it 'should change request method to `PUT`', (done) ->
    q.when(res, () ->
      expect(jsgiRequest.method).toBe 'PUT'
      done()
    , (err) =>
      this.fail(err)
      done()
    )

describe 'gzip', ->
  jsgiRequest = null
  res = null

  beforeEach ->
    headers = { 'content-type': 'text/html', 'accept-encoding': 'gzip' }
    jsgiRequest = { method: 'post', env: {}, headers: headers, body: [] }

    gzipMiddleware = bogart.middleware.gzip (req) ->
      bogart.html 'Hello World'

    res = gzipMiddleware jsgiRequest

  it 'should have response body', (done) ->
    q.when(res, (res) ->
      expect(typeof res.body).toBe 'object'
      done()
    , (err) =>
      this.fail(err)
      done()
    )

  it 'should have correct content-type', (done) ->
    q.when(res, (res) ->
      expect(res.headers['content-type']).toBe 'text/html'
      done()
    , (err) =>
      this.fail(err);
      done();
    )

  it 'should have correct status', (done) ->
    q.when(res, (res) ->
      expect(res.status).toBe 200
      done()
    , (err) =>
      this.fail(err)
      done()
    )

describe 'error middleware given exception', ->
  res = null
  errorMessage = '__Intentional Error Test__'

  beforeEach ->
    errorMiddleware = bogart.middleware.error { logError: false }, (req) ->
      throw new Error(errorMessage)

    res = errorMiddleware { method: 'get', env: {}, headers: {}, body: [] }

  it 'should have correct status', (done) ->
    q.when res, (res) ->
      expect(res.status).toBe 500
      done()

  it 'should have correct content-type', (done) ->
    q.when res, (res) ->
      expect(res.headers['content-type']).toBe 'text/html'
      done()

  it 'should contain error message', (done) ->
    q.when res, (res) ->
      expect(res.body.join('')).toContain(errorMessage)
      done()

describe 'error middleware rejected promise given string', ->
  rejectionMessage = '__INTENTIONAL REJECTION__'
  res = null

  beforeEach ->
    errorMiddleware = bogart.middleware.error { logError: false }, (req) ->
      q.reject rejectionMessage

    res = errorMiddleware { body: [], headers: {}, env: {} }

  it 'should have correct status', (done) ->
    q.when res, (res) ->
      expect(res.status).toBe 500
      done()

  it 'should have correct content-type', (done) ->
    q.when res, (res) ->
      expect(res.headers['content-type']).toBe 'text/html'
      done()

  it 'should contain rejection message', (done) ->
    q.when res, (res) ->
      expect(res.body.join '').toContain rejectionMessage
      done()

describe 'error middleware rejected promise given Error', ->
  errorMessage = '__INTENTIONAL ERROR__'
  rejectionError = new Error errorMessage
  res = null

  beforeEach ->
    errorMiddleware = bogart.middleware.error { logError: false }, (req) ->
      q.reject rejectionError

    res = errorMiddleware { body: [], headers: {}, env: {} }

  it 'should have correct status', (done) ->
    q.when res, (res) ->
      expect(res.status).toBe 500
      done()

  it 'should have correct content-type', (done) ->
    q.when res, (res) ->
      expect(res.headers['content-type']).toBe 'text/html'
      done()

  it 'should contain error message', (done) ->
    q.when res, (res) ->
      expect(res.body.join '').toContain errorMessage
      done()

describe 'flash middleware', ->
  res = null
  foo = null
  jsgiRequest = null
  flashMiddleware = null

  beforeEach ->
    flashMiddleware = bogart.middleware.flash {}, (req) ->
      req.flash 'foo', 'bar'

      foo = req.flash 'foo'

      { status: 200, body: [], headers: { 'content-type': 'text/html' } }

    jsgiRequest = { headers: { 'content-type': 'text/plain' }, body: [] }

    res = flashMiddleware(jsgiRequest).then (res) ->
      cookieStr = res.headers['Set-Cookie'].join('').replace(/;$/, '');
      jsgiRequest.headers.cookie = cookieStr
      res

  describe 'first request', ->

    it 'should have `foo` value of undefined', (done) ->
      q.when res, (res) ->
        expect(foo).toEqual undefined
        done()

  describe 'second request', ->

    beforeEach ->
      res = q.when res, () ->
        flashMiddleware jsgiRequest

    it 'should have correct `foo` value', (done) ->
      q.when res, (res) ->
        expect(foo).toEqual 'bar'
        done()

describe 'parted', ->
  partedMiddleware = null
  res = null

  beforeEach ->
    partedMiddleware = bogart.middleware.parted (req) ->
      req
  
  describe 'json', ->

    beforeEach ->
      res = partedMiddleware {
        headers: { 'content-type': 'application/json' },
        body: [ '{ "hello": "world" }' ],
        env: {},
        method: 'POST'
      }

    it 'should have correct body', (done) ->
      q.when res, (req) ->
        expect(req.body.hello).toBe 'world'
        done()

  describe 'form url-encoded', ->

    beforeEach ->
      body = {
        forEach: (callback) ->
          callback('hello=world')
      }

      res = partedMiddleware {
        method: 'POST',
        env: {},
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: body
      }

    it 'should have correct body', (done) ->
      q.when res, (res) ->
        expect(res.body.hello).toBe 'world'
        done()

  describe 'multipart form-encoded', ->

    beforeEach ->
      res = partedMiddleware multipartRequest(100, 'chrome')

    it 'should have content', (done) ->
      q.when res, (res) ->
        expect(res.body.content).not.toBe undefined
        done()

describe 'session', ->
  sessionApp = null
  firstRequest = true
  res = null
  values = []

  beforeEach ->
    sessionApp = bogart.middleware.session {}, (req) ->
      req.session('foo', 'bar') if firstRequest
      firstRequest = false

      values.push req.session('foo')

      return {
        status: 200,
        body: []
      }

    headers = { 'content-type': 'text/plain' }
    jsgiRequest = { headers: headers, body: [] }

    res = q.when sessionApp(jsgiRequest), (res) ->
      cookieStr = res.headers['Set-Cookie'].join('').replace(/;$/, '');

      jsgiRequest.headers.cookie = cookieStr

      q.when sessionApp(jsgiRequest)

  it 'should have correct value for first request', (done) ->
    q.when res, (res) ->
      expect(values[0]).toBe 'bar'
      done()
    , (err) =>
      this.fail err

  it 'should have correct value for second request', (done) ->
    q.when res, (res) ->
      expect(values[1]).toBe 'bar'
      done()
    , (err) =>
      this.fail err

describe 'validate response middleware', ->
  validateResApp = null

  describe 'null response', ->

    beforeEach ->
      validateResApp = bogart.middleware.validateResponse (req) ->
        null

    it 'should have correct error', (done) ->
      validateResApp().fail (err) ->
        expect(err).toBe 'Response must be an object.'
        done()
      , (err) =>
        this.fail error
        done()

  describe 'response without a body', ->

    beforeEach ->
      validateResApp = bogart.middleware.validateResponse (req) ->
        { status: 200, headers: {} }

    it 'should have correct error', (done) ->
      validateResApp().fail (err) ->
        expect(err).toBe 'Response must have a body property.'
        done()

  describe 'response that has a body that is not a forEachable', ->

    beforeEach ->
      validateResApp = bogart.middleware.validateResponse (req) ->
        { status: 200, body: {}, headers: {} }

    it 'should have correct error', (done) ->
      validateResApp().fail (err) ->
        expect(err).toBe 'Response body must have a forEach method.'
        done()

  describe 'given response with body that has a forEach property that is not a function', ->

    beforeEach ->
      validateResApp = bogart.middleware.validateResponse (req) ->
        { status: 200, body: { forEach: {} }, headers: {} }

    it 'should have correct error', (done) ->
      validateResApp().fail (err) ->
        expect(err).toBe 'Response body has a forEach method but the forEach method is not a function.'
        done()

  describe 'given a response without status', ->

    beforeEach ->
      validateResApp = bogart.middleware.validateResponse (req) ->
        { body: [], headers: {} }

    it 'should have correct error', (done) ->
      validateResApp().fail (err) ->
        expect(err).toBe 'Response must have a status property.'
        done()

  describe 'given a response with a non-number status', ->

    beforeEach ->
      validateResApp = bogart.middleware.validateResponse (req) ->
        { body: [], headers: {}, status: '200' }

    it 'should have correct error', (done) ->
      validateResApp().fail (err) ->
        expect(err).toBe 'Response has a status property but the status property must be a number.'
        done()

describe 'string return adapter', ->
  str = null
  res = null

  beforeEach ->
    str = 'This is a message'
    req = mockRequest.root()

    stringReturnAdapterApp = bogart.middleware.stringReturnAdapter ->
      str

    res = stringReturnAdapterApp req

  it 'should have correct body', (done) ->
    q.when res, (res) ->
      expect(res.body).toEqual([ str ])
      done()

describe 'batteries', ->

  describe 'given directory configuration', ->

    beforeEach ->
      spyOn bogart.middleware, 'directory'
      bogart.middleware.batteries({ directory: 'public' })((req) -> {})

    it 'should pass correct configuration to directory middleware', ->
      expect(bogart.middleware.directory).toHaveBeenCalledWith 'public', jasmine.any(Function)

  describe 'given empty configuration', ->

    beforeEach ->
      spyOn bogart.middleware, 'directory'
      bogart.middleware.batteries({})((req) -> {})

    it 'should pass default configuration for `directory`', ->
      expect(bogart.middleware.directory).toHaveBeenCalledWith 'public', jasmine.any(Function)

###
Create a mock request  
Modified from the mock request method in Parted in compliance with the license.
###
multipartRequest = (size, file) ->
  fs = require 'fs'
  path = require 'path'

  file = path.join __dirname, 'fixtures', file+'.part'

  stream = fs.createReadStream file, {
    bufferSize: size
  }

  boundary = fs
    .readFileSync(file)
    .toString('utf8')
    .match(/--[^\r\n]+/)[0]
    .slice(2)

  res =
    headers: { 'content-type': 'multipart/form-data; boundary="' + boundary + '"' }
    method: 'POST'
    env: {}
    pipe: (dest) ->
      stream.pipe dest
    emit: (ev, err) ->
      this.errback && this.errback(err) if ev == 'error'
      this
    on: (ev, func) ->
      this.errback = func if ev == 'error'
      this
    destroy: () ->
      stream.destroy()
      this
    body:
      forEach: (fn) ->
        deferred = q.defer()

        stream.on 'data', (data) ->
          fn data

        stream.on 'end', ->
          deferred.resolve()

        deferred.promise
