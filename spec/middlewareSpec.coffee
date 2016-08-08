bogart = require '../lib/bogart'
q = bogart.q
mockRequest = require './helpers/JsgiRequestHelper'

jasmine.getEnv().defaultTimeoutInterval = 100;

anyObject = (-> jasmine.any Object)
anyString = (-> jasmine.any String)

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
    methodOverrideMiddleware = bogart.middleware.methodOverride()

    headers = { 'content-type': 'text/html' }
    jsgiRequest = { method: 'post', env: {}, body: { _method: 'put' }, headers: headers }

    res = methodOverrideMiddleware jsgiRequest, jasmine.createSpy('next')

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

    gzipMiddleware = bogart.middleware.gzip() 

    res = gzipMiddleware jsgiRequest, (req) ->
      bogart.html 'Hello World'

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
    errorMiddleware = bogart.middleware.error
      logError: false

    errorApp = (req) ->
      throw new Error(errorMessage)

    res = errorMiddleware { method: 'get', env: {}, headers: {}, body: [] }, errorApp

  it 'should have correct status', (done) ->
    q(res)
      .then (res) ->
        expect(res.status).toBe 500
      .fail (err) =>
        @fail err
      .fin done

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
    errorMiddleware = bogart.middleware.error
      logError: false

    res = errorMiddleware { body: [], headers: {}, env: {} }, (req) ->
      q.reject rejectionMessage

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
    errorMiddleware = bogart.middleware.error
      logError: false

    res = errorMiddleware { body: [], headers: {}, env: {} }, (req) ->
      q.reject rejectionError

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
  next = null

  beforeEach ->
    flashMiddleware = bogart.middleware.flash {}

    next = (req) ->
      req.flash 'foo', 'bar'

      foo = req.flash 'foo'

      { status: 200, body: [], headers: { 'content-type': 'text/html' } }

    jsgiRequest = { headers: { 'content-type': 'text/plain' }, body: [] }

    res = flashMiddleware(jsgiRequest, next).then (res) ->
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
        flashMiddleware jsgiRequest, next

    it 'should have correct `foo` value', (done) ->
      q.when res, (res) ->
        expect(foo).toEqual 'bar'
        done()

describe 'parted', ->
  partedMiddleware = null
  res = null

  beforeEach ->
    partedMiddleware = bogart.middleware.parted()
  
  describe 'json', ->
    next = null

    beforeEach ->
      next = jasmine.createSpy('next')

      res = partedMiddleware {
        headers: { 'content-type': 'application/json' },
        body: [ '{ "hello": "world" }' ],
        env: {},
        method: 'POST'
      }, next

    it 'should call next', (done) ->
      q.when(res)
        .then (req) ->
          expect(next).toHaveBeenCalled()
        .fail (err) =>
          @fail err
        .fin done

  describe 'form url-encoded', ->
    next = null

    beforeEach ->
      body = {
        forEach: (callback) ->
          callback('hello=world')
      }

      next = jasmine.createSpy('next')

      res = partedMiddleware {
        method: 'POST',
        env: {},
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: body
      }, next

    it 'should call next', (done) ->
      q(res) 
        .then (res) ->
          expect(next).toHaveBeenCalled()
        .fail (err) =>
          @fail err
        .fin done

  describe 'multipart form-encoded', ->
    next = null

    beforeEach ->
      next = jasmine.createSpy('next')
      res = partedMiddleware multipartRequest(100, 'chrome'), next

    it 'should call next', (done) ->
      q(res)
        .then (res) ->
          expect(next).toHaveBeenCalled()
        .fail (err) =>
          @fail err
        .fin done

describe 'SessionMiddleware', ->
  sessionApp = null
  req = null
  res = null
  next = null
  nextRes = null
  sessionConfig = null

  SESSION_ID = 'Id returned from getSessionId'

  beforeEach ->
    sessionConfig =
      secret: 'my-super-secret'
      idProvider: jasmine.createSpyObj 'Id Provider', [ 'getSessionId', 'save' ]
      store: jasmine.createSpyObj 'Data Provider', [ 'loadSession', 'save' ]

    sessionConfig.idProvider.getSessionId.andReturn SESSION_ID

    sessionApp = bogart.middleware.session sessionConfig

    nextRes =
      status: 200,
      body: [],
      headers: {}

    next = jasmine.createSpy('next')
    next.andReturn(nextRes)

    headers =
      'content-type': 'text/plain'

    req =
      headers: headers
      body: []

    res = sessionApp req, next

  it 'should call SessionIdProvider#getSessionId', (done) ->
    res
      .then ->
        expect(sessionConfig.idProvider.getSessionId).toHaveBeenCalledWith(req)
      .fail (err) =>
        @fail err
      .fin done

  loadSessionCallSpec = (description, a, b) ->
    it "should call SessionDataProvider#loadSession with correct #{description}", (done) ->
      res
        .then ->
          expect(sessionConfig.store.loadSession).toHaveBeenCalledWith(a(), b())
        .fail (err) =>
          @fail err
        .fin done

  loadSessionCallSpec 'request', (-> req), anyString
  loadSessionCallSpec 'session id', anyObject, (-> SESSION_ID)

  sessionIdProviderSaveCallSpec = (description, a, b, c) ->
    it "should call SessionIdProvider#save with correct #{description}", (done) ->
      res
        .then ->
          expect(sessionConfig.idProvider.save).toHaveBeenCalledWith(a(), b(), c())
        .fail (err) =>
          @fail err
        .fin done

  sessionIdProviderSaveCallSpec 'request', (-> req), anyObject, anyString
  sessionIdProviderSaveCallSpec 'response', anyObject, (-> nextRes), anyString
  sessionIdProviderSaveCallSpec 'session id', anyObject, anyObject, (-> SESSION_ID)

  sessionDataProviderSaveCallSpec = (description, a, b, c) ->
    it "should call SessionDataProvider#save with correct #{description}", (done) ->
      res
        .then ->
          expect(sessionConfig.store.save).toHaveBeenCalledWith(a(), b(), c())
        .fail (err) =>
          @fail err
        .fin done

  sessionDataProviderSaveCallSpec 'request', (-> req), anyObject, anyString
  sessionDataProviderSaveCallSpec 'session id', anyObject, anyObject, (-> SESSION_ID)
  sessionDataProviderSaveCallSpec 'response', anyObject, (-> nextRes), anyString

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

  req =
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
