require('jasmine-expect')
bogart = require '../lib/bogart'
MockRequest = require './helpers/JsgiRequestHelper'
Router = (require '../lib/router').Router
q = require 'q'
Injector = require 'bogart-injector'

jasmine.getEnv().defaultTimeoutInterval = 100;

mockInjector = (name, childInjector) ->
  if typeof name == 'object' || typeof name == 'function'
    childInjector = name
    name = undefined
  else
    childInjector = jasmine.createSpyObj 'Child Injector', [ 'value', 'invoke', 'createChild', 'has', 'resolve' ]

  injector = jasmine.createSpyObj name || 'Injector', [ 'value', 'invoke', 'createChild', 'has', 'resolve' ]
  injector.createChild.andReturn(childInjector)
  injector

createInjector = (req) ->
  injector = new Injector()
  injector.value('req', req)
  injector

describe 'Router', ->
  router = null

  beforeEach ->
    router = bogart.router()

  it 'should have `on` method', ->
    expect(router.on).toBeFunction()

  it 'should have `emit` method', ->
    expect(router.emit).toBeFunction()

describe 'invokes route callbacks', ->
  router = null
  injector = null
  routeCallback = null
  next = null
  res = null

  beforeEach ->
    req = MockRequest.root()

    next = jasmine.createSpy 'next'

    injector = createInjector req
    injector.value 'next', next
    spyOn(injector, 'invoke').andCallThrough()

    routeCallback = ->
      bogart.html 'hello world'

    router = bogart.router()
    router.get '/', routeCallback

    res = router injector

  it 'should invoke without a `next` in locals', (done) ->
    res
      .then ->
        expect(injector.invoke).toHaveBeenCalledWith(jasmine.any(Function), null,
          {})
      .fail (err) =>
        @fail err
      .fin done

describe 'invokes multiple route callbacks', ->
  router = null
  injector = null
  callbackA = null
  callbackB = null
  res = null

  beforeEach (done) ->
    req = MockRequest.root()

    injector = createInjector req
    spyOn(injector, 'invoke').andCallThrough()

    callbackA = (next) ->
      next()

    callbackB = ->
      bogart.text 'hello world'

    router = bogart.router()
    router.get '/', callbackA, callbackB

    router(injector).then(((response) -> res = response))
      .fail(@fail)
      .fin(done)

  it 'should have correct response', ->
    expect(res)

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

    injector = createInjector req

    res = router injector 

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

    res = router createInjector(new MockRequest('/hello/nathan'))

  it 'should have called first route', (done) ->
    q.when res, (res) ->
      expect(firstCalled).toBe true
      done()

  it 'should not have called second route', (done) ->
    q.when res, ->
      expect(secondCalled).toBe false
      done()

describe 'partially matched route', ->
  res = null

  beforeEach ->
    router = bogart.router()

    router.get '/partial-match', (req) ->
      { status: 200, body: [ 'hello' ], headers: {} }

    injector = createInjector(new MockRequest('/partial-match/path'))
    injector.value('next', null)

    res = router injector

  it 'should be undefined', ->
    expect(res).toBeUndefined()

describe 'partially matched route with parameter', ->
  res = null

  beforeEach ->
    router = bogart.router()
    router.get '/:foo', (req) ->
      return { status: 200, body: [ 'hello' ], headers: {} }

    injector = createInjector(new MockRequest('/hello/world'))
    injector.value('next', null)

    res = router injector

  it 'should be undefined', ->
    expect(res).toBeUndefined()

describe 'route with querystring', ->
  res = null

  beforeEach ->
    router = bogart.router()

    router.get '/home', (req) ->
      { status: 200, body: [ 'home' ], headers: {} }

    req = new MockRequest('/home')
    req.queryString = 'hello=world'

    res = router createInjector(req)

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

    res = router createInjector(new MockRequest('/hello/cruel/world'))

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

    res = router createInjector(new MockRequest('/foo%2fbar'))

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

    res = router createInjector(new MockRequest('/user@example.com/name'))


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

    res = router createInjector(new MockRequest(''))

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

    res = router createInjector(new MockRequest(''))

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

    res = router createInjector(new MockRequest('/path%20with%20spaces'))

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

    res = router createInjector(new MockRequest('/foo.bar'))

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

    res = router createInjector(new MockRequest('/foo/baz/dash-url'))

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

    res = router createInjector(new MockRequest('/foo/hello/there'))

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

    res = router createInjector(new MockRequest('/download/images/ninja-cat.jpg'))

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

    res = router createInjector(new MockRequest('/foo/bar/baz'))

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

    res = router createInjector(MockRequest.root())

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

