require('jasmine-expect')
bogart = require '../lib/bogart'
MockRequest = require './helpers/JsgiRequestHelper'
Router = (require '../lib/router').Router
q = require 'q'

jasmine.getEnv().defaultTimeoutInterval = 100;

mockInjector = (name) ->
  jasmine.createSpyObj name || 'Injector', [ 'value', 'invoke' ]

describe 'Router', ->
  router = null

  beforeEach ->
    router = bogart.router()

  it 'should have `on` method', ->
    expect(router.on).toBeFunction()

  it 'should have `emit` method', ->
    expect(router.emit).toBeFunction()

describe 'invokes route callbacks with injector', ->
  router = null
  injector = null
  childInjector = null
  routeCallback = null
  res = null

  beforeEach ->
    childInjector = mockInjector 'Child Injector'

    injector = jasmine.createSpyObj 'Injector', [ 'createChild' ]
    injector.createChild.andReturn childInjector

    router = bogart.router()

    routeCallback = (req) ->
      bogart.html 'hello world'

    router.get '/', routeCallback

    res = router injector, MockRequest.root()

  it 'should create child injector', (done) ->
    res
      .then ->
        expect(injector.createChild).toHaveBeenCalled()
      .fail (err) =>
        @fail err
      .fin done

  it 'should call child injector invoke', (done) ->
    res
      .then ->
        expect(childInjector.invoke).toHaveBeenCalledWith(routeCallback)
      .fail (err) =>
        @fail err
      .fin done

describe 'matches parameter', ->
  req = null
  router = null
  res = null
  name = null

  beforeEach ->
    req = MockRequest.root()

    router = bogart.router()

    router.get '/hello/:name', (req) ->
        name = req.params.name
        bogart.html 'hello'

    req.pathInfo = '/hello/nathan'

    res = router req

  it 'should have correct status', (done) ->
    res
      .then (res) ->
        expect(res.status).toBe 200
      .fail (err) =>
        @fail err
      .fin done

  it 'should have correct name', (done) ->
    res
      .then (res) ->
        expect(name).toBe 'nathan'
      .fail (err) =>
        @fail err
      .fin done

describe 'order of routes matching should be in order defined', ->
  router = null
  res = null
  firstCalled = false
  secondCalled = false
  
  beforeEach ->
    router = bogart.router()

    router.get '/hello/:name', (req) ->
      firstCalled = true
      bogart.html 'hello'

    router.get '/hello/:name/:something', (req) ->
      secondCalled = true
      bogart.html 'hello'

    res = router new MockRequest('/hello/nathan')

  it 'should have called first route', (done) ->
    q.when res, (res) ->
      expect(firstCalled).toBe true
      done()

  it 'should not have called second route', (done) ->
    q.when res, ->
      expect(secondCalled).toBe false
      done()

describe 'should call notFoundApp', ->
  notFoundApp = null
  router = null
  res = null
  called = false
  notFoundRes = null

  beforeEach ->
    notFoundRes = { status: 404, body: [ '' ], headers: {} }

    notFoundApp = (req) ->
      called = true
      notFoundRes

    router = bogart.router()

    res = router MockRequest.root(), notFoundApp

  it 'should have correct response', (done) ->
    res
      .then (res) ->
        expect(res).toBe notFoundRes
      .fail (err) =>
        @fail err
      .fin done

  it 'should have called the not found app', (done) ->
    res
      .then (res) ->
        expect(called).toBe true
      .fail (err) =>
        @fail err
      .fin done

describe 'default notFoundApp behavior of returning 404', ->
  res = null

  beforeEach ->
    router = bogart.router()

    res = router MockRequest.root()

  it 'should have status of 404', (done) ->
    res
      .then (res) ->
        expect(res.status).toBe 404
      .fail (err) =>
        @fail err
      .fin done

describe 'router.notFound', ->
  notFoundCallback = null
  req = null
  res = null
  router = null

  beforeEach ->
    notFoundCallback = jasmine.createSpy 'not found callback'

    router = bogart.router()
    router.notFound(notFoundCallback)

    req = MockRequest.root()
    res = router req

  it 'should call notFound callback', (done) ->
    q(res)
      .then ->
        expect(notFoundCallback).toHaveBeenCalled()
      .fail (err) =>
        @fail err
      .fin done

describe 'partially matched route', ->
  res = null

  beforeEach ->
    router = bogart.router()

    router.get '/partial-match', (req) ->
      { status: 200, body: [ 'hello' ], headers: {} }

    res = router new MockRequest('/partial-match/path')

  it 'should have status of 404', (done) ->
    q(res)
      .then (res) ->
        expect(res.status).toBe 404
      .fail (err) =>
        @fail err
      .fin done

describe 'partially matched route with parameter', ->
  res = null

  beforeEach ->
    router = bogart.router()
    router.get '/:foo', (req) ->
      return { status: 200, body: [ 'hello' ], headers: {} }

    res = router new MockRequest('/hello/world')

  it 'should have status of 404', (done) ->
    res
      .then (res) ->
        expect(res.status).toBe 404
      .fail (err) =>
        @fail err
      .fin done

describe 'route with querystring', ->
  res = null

  beforeEach ->
    router = bogart.router()

    router.get '/home', (req) ->
      { status: 200, body: [ 'home' ], headers: {} }

    req = new MockRequest('/home')
    req.queryString = 'hello=world'

    res = router req

  it 'should have correct status', (done) ->
    res
      .then (res) ->
        expect(res.status).toBe 200
      .fail (err) =>
        @fail err
      .fin done

describe 'regex route', ->
  res = null
  splat = null
  routeRes = null

  beforeEach ->
    router = bogart.router()

    routeRes = bogart.html 'hello'

    router.get /\/hello\/(.*)\/(.*)/, (req) ->
      splat = req.params.splat
      routeRes

    res = router new MockRequest('/hello/cruel/world')

  it 'should have correct splat', (done) ->
    res
      .then (res) ->
        expect(splat).toEqual [ 'cruel', 'world' ]
      .fail (err) =>
        @fail err
      .fin done

  it 'should have correct response', (done) ->
    res
      .then (res) ->
        expect(res).toBe routeRes
      .fail (err) =>
        @fail err
      .fin done

describe 'request path with encoded slashes', ->
  res = null
  routeRes = null

  beforeEach ->
    routeRes = bogart.html 'hello'

    router = bogart.router()

    router.get '/:foo', (req) ->
      routeRes

    res = router new MockRequest('/foo%2fbar')

  it 'should have correct response', (done) ->
    res
      .then (res) ->
        expect(res).toBe routeRes
      .fail (err) =>
        @fail err
      .fin done

describe 'request with a dot (".") as part of the named parameter', ->
  res = null
  params = null
  routeRes = null
  res = null

  beforeEach ->
    routeRes = bogart.html 'hello'

    router = bogart.router()
    router.get '/:foo/:bar', (req) ->
      params = req.params
      routeRes

    res = router new MockRequest('/user@example.com/name')


  it 'should have correct :foo param', (done) ->
    res
      .then ->
        expect(params.foo).toBe 'user@example.com'
      .fail (err) =>
        @fail err
      .fin done

  it 'should have correct :bar param', (done) ->
    res
      .then ->
        expect(params.bar).toBe 'name'
      .fail (err) =>
        @fail err
      .fin done

  it 'should have correct response', (done) ->
    res
      .then (res) ->
        expect(res).toBe routeRes
      .fail (err) =>
        @fail err
      .fin done

describe 'matches empty `pathInfo` to "/" if no route is defined for ""', ->
  res = null
  routeRes = null

  beforeEach ->
    routeRes = bogart.text 'success'

    router = bogart.router()
    router.get '/', ->
      routeRes

    res = router new MockRequest('')

  it 'should have correct response', (done) ->
    res
      .then (res) ->
        expect(res).toBe routeRes
      .fail (err) =>
        @fail err
      .fin done

describe 'matches empty `pathInfo` to "" if a route is defined for ""', ->
  res = null
  rightRouteRes = null
  wrongRouteRes = null

  beforeEach ->
    rightRouteRes = bogart.text 'right'
    wrongRouteRes = bogart.text 'wrong'

    router = bogart.router()

    router.get '', (req) ->
      rightRouteRes

    router.get '/', (req) ->
      wrongRouteRes

    res = router new MockRequest('')

  it 'should have correct response', (done) ->
    res
      .then (res) ->
        expect(res).toBe rightRouteRes
      .fail (err) =>
        @fail err
      .fin done

describe 'paths that include spaces', ->
  res = null
  routeRes = null

  beforeEach ->
    routeRes = bogart.text 'spaces are cool'
    router = bogart.router()

    router.get '/path with spaces', (req) ->
      routeRes

    res = router new MockRequest('/path%20with%20spaces')

  it 'should have correct response', (done) ->
    res
      .then (res) ->
        expect(res).toBe routeRes
      .fail (err) =>
        @fail err
      .fin done

describe 'literal (".") in path', ->
  res = null
  routeRes = null

  beforeEach ->
    routeRes = bogart.text 'hello'

    router = bogart.router()

    router.get '/foo.bar', ->
      routeRes

    res = router new MockRequest('/foo.bar')

  it 'should have correct response', (done) ->
    res
      .then (res) ->
        expect(res).toBe routeRes
      .fail (err) =>
        @fail err
      .fin done

describe '("-") in path', ->
  res = null
  routeRes = null

  beforeEach ->
    routeRes = bogart.text 'hello'

    router = bogart.router()

    router.get '/foo/:bar/dash-url', ->
      routeRes

    res = router new MockRequest('/foo/baz/dash-url')

  it 'should have correct response', (done) ->
    res
      .then (res) ->
        expect(res).toBe routeRes
      .fail (err) =>
        @fail err
      .fin done

describe 'path with splat ("*")', ->
  routeRes = null
  res = null
  params = null

  beforeEach ->
    routeRes = bogart.text 'splat'

    router = bogart.router()

    router.get '/foo/*', (req) ->
      params = req.params
      routeRes

    res = router new MockRequest('/foo/hello/there')

  it 'should have correct splat', (done) ->
    res
      .then (res) ->
        expect(params.splat[0]).toBe 'hello/there'
      .fail (err) =>
        @fail err
      .fin done

  it 'should have correct response', (done) ->
    res
      .then (res) ->
        expect(res).toBe routeRes
      .fail (err) =>
        @fail err
      .fin done

describe 'path with multiple splat parameters', ->
  routeRes = null
  res = null
  params = null

  beforeEach ->
    routeRes = bogart.text 'splat'

    router = bogart.router()

    router.get '/download/*/*', (req) ->
      params = req.params
      routeRes

    res = router new MockRequest('/download/images/ninja-cat.jpg')

  it 'should have correct splat', (done) ->
    res
      .then (res) ->
        expect(params.splat).toEqual [ 'images', 'ninja-cat.jpg' ]
      .fail (err) =>
        @fail err
      .fin done

  it 'should have correct response', (done) ->
    res
      .then (res) ->
        expect(res).toBe routeRes
      .fail (err) =>
        @fail err
      .fin done

describe 'mixing splat and named parameters', ->
  routeRes = null
  res = null
  params = null

  beforeEach ->
    routeRes = bogart.text 'mix'

    router = bogart.router()

    router.get '/:foo/*', (req) ->
      params = req.params
      routeRes

    res = router new MockRequest('/foo/bar/baz')

  it 'should have correct response', (done) ->
    res
      .then (res) ->
        expect(res).toBe routeRes
      .fail (err) =>
        @fail err
      .fin done

  it 'should have correct named parameter', (done) ->
    res
      .then (res) ->
        expect(params.foo).toBe 'foo'
      .fail (err) =>
        @fail err
      .fin done

  it 'should have correct splat parameter', (done) ->
    res
      .then (res) ->
        expect(params.splat).toEqual [ 'bar/baz' ]
      .fail (err) =>
        @fail err
      .fin done

describe 'chaining route handlers', ->
  routeRes = null
  res = null
  hello = null

  beforeEach ->
    routeRes = bogart.text 'hello'

    router = bogart.router()

    firstHandler = (req, next) ->
      req.hello = 'world'
      next req

    secondHandler = (req) ->
      hello = req.hello
      routeRes

    router.get '/', firstHandler, secondHandler

    res = router MockRequest.root()

  it 'should have correct response', (done) ->
    res
      .then (res) ->
        expect(res).toBe routeRes
      .fail (err) =>
        @fail err
      .fin done

  it 'should have correct value set by first handler', (done) ->
    res
      .then ->
        expect(hello).toBe 'world'
      .fail (err) =>
        @fail err
      .fin done

