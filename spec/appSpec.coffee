bogart = require '../lib/bogart'

describe 'bogart app', ->
  app = null

  beforeEach ->
    app = bogart.app()

  describe 'given custom injector', ->
    injector = null
    app = null

    beforeEach ->
      injector = jasmine.createSpyObj('Injector', [ 'value' ])
      app = bogart.app(injector)

    it 'should set property of app', ->
      expect(app.injector).toBe(injector)

    it 'router should have custom injector', ->
      expect(app._router.injector).toBe(injector)

    it 'should register itself', ->
      expect(injector.value).toHaveBeenCalledWith('injector', injector)

  describe 'injector', ->
    it 'should be defined', ->
      expect(app.injector).not.toBe(undefined)

  describe 'listen', ->
    req = null
    res = null

    beforeEach ->
      req = jasmine.createSpy('Request');

      spyOn(app.injector, 'createChild').andCallThrough()

      # Needed so that there will be some middleware
      app.use (req) ->
        bogart.q(bogart.text 'hello')

      res = app.listen(req)

    it 'should create child injector', (done) ->
      res
        .then ->
          expect(app.injector.createChild).toHaveBeenCalled()
        .fail (err) =>
          @fail err
        .fin done

  describe 'listen given no middleware', ->
    it 'should throw error', ->
      req = jasmine.createSpy('Request')

      exec = ->
        app.listen(req)
      
      expect(exec).toThrow()

  describe 'given a router with no parameters', ->

    it 'should not be started', ->
      expect(app.started).toBe(false)

    it 'should have `use` method', ->
      expect(typeof app.use).toBe('function')

    describe 'afterAddMiddleware event', ->
      appParam = null
      middlewareParam = null
      router = null

      beforeEach ->
        router = bogart.router()

        app.on 'afterAddMiddleware', (app, middleware) ->
          appParam = app
          middlewareParam = middleware

        app.use router

      it 'should raise afterAddMiddleware with correct app parameters', ->
        expect(appParam).toBe(app)

      it 'should raise afterAddMiddleware with correct middleware parameter', ->
        expect(middlewareParam).toBe(router)

  describe 'App#router', ->
    injector = null
    app = null
    router = null
    childInjector = null

    beforeEach ->
      childInjector = jasmine.createSpyObj 'Child Injector', [ 'value', 'invoke' ]

      injector = jasmine.createSpyObj 'Injector', [ 'createChild', 'value' ]
      injector.createChild.andReturn childInjector

      app = bogart.app(injector)

      spyOn(app, 'use')

      router = app.router()

    it 'should create child injector for router', ->
      expect(injector.createChild).toHaveBeenCalled()

    it 'should have child injector from injector.createChild', ->
      expect(router.injector).toBe(childInjector)

    it 'should App#use the router', ->
      expect(app.use).toHaveBeenCalledWith(router)

  describe 'App as a router', ->
    METHODS = [ 'get', 'put', 'post', 'del' ]
    router = null
    app = null

    beforeEach ->
      router = jasmine.createSpy 'Router'
      [ 'get', 'put', 'post', 'del' ].forEach (method) ->
        router[method] = jasmine.createSpy 'Router#'+method

      spyOn(bogart, 'router').andReturn router

      app = bogart.app()
      spyOn(app, 'use').andCallThrough()

    METHODS.forEach (method) ->
      it "should have correct App\##{method}", ->
        app[method]('/', bogart.noop())
        expect(router[method]).toHaveBeenCalled()

    it 'should app.use router', ->
      app._usedImplicitRouter = true

      spyOn(bogart, 'start')

      app.start();
      expect(app.use).toHaveBeenCalledWith(router)

  describe 'starting the app', ->
    server = {}
    result = null

    beforeEach ->
      spyOn(bogart, 'start').andReturn server

      app.use(->
        return (req) ->
          bogart.html 'Hello World'
      )

      result = app.start()

    it 'should be started', ->
      expect(app.started).toBe(true)
    
    it 'should have been called with correct jsgi parameters', ->
      expect(bogart.start).toHaveBeenCalledWith(jasmine.any(Function), { port: 8080, host: '127.0.0.1' })

    it 'should return server', ->
      expect(result).toBe(server)

  describe 'given JSGI options', ->
    router = null
    server = {}
    jsgiOpts = null

    beforeEach ->
      spyOn(bogart, 'start').andReturn server

      router = bogart.router()
      app.use router

      jsgiOpts = { port: 1337, host: 'whiteboard-it.com', somethingElse: 'anotherOption' }
      app.start jsgiOpts

    it 'should be started', ->
      expect(app.started).toBe(true)

    it 'should have been started with correct JSGI Options', ->
      expect(bogart.start).toHaveBeenCalledWith jasmine.any(Function), jsgiOpts

