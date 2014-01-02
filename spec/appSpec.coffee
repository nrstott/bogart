bogart = require '../lib/bogart'

describe 'bogart app', ->
  app = null

  beforeEach ->
    app = bogart.app()

  describe 'injector', ->
    it 'should be defined', ->
      expect(app.injector).not.toBe(undefined)

    it 'should let me pass an injector', ->
      injector = jasmine.createSpy('Injector')
      expect(bogart.app(injector).injector).toBe(injector)

    describe 'instantiating middleware', ->
      app = null
      middleware1ConfigVal = null
      middleware1NextVal = null
      middleware2NextVal = null

      middleware1 = (config, next) ->
        middleware1ConfigVal = config
        middleware1NextVal = next
        (req) ->
          next()

      middleware2 = (next) ->
        middleware2NextVal = next
        middleware2Responder

      middleware2Responder = (req) ->
        bogart.html 'hello world'

      beforeEach ->
        app = bogart.app()
        app.use middleware1
        app.use middleware2

        app.injector.value('config', {
          foo: 'bar'
        });

        spyOn(app.injector, 'factory').andCallThrough()
        spyOn(app.injector, 'invoke').andCallThrough()

        spyOn(bogart, 'start')

        app.start()

      it 'should create `next` factory', ->
        expect(app.injector.factory).toHaveBeenCalledWith('next', jasmine.any(Function))

      it 'should create `nextApp` factory', ->
        expect(app.injector.factory).toHaveBeenCalledWith('nextApp', jasmine.any(Function))

      it 'should invoke middleware1', ->
        expect(app.injector.invoke).toHaveBeenCalledWith(middleware1 )

      it 'should have passed correct config', ->
        expect(middleware1ConfigVal).toEqual({ foo: 'bar' })

      it 'should have passed correct next', ->
        expect(middleware1NextVal).toBe(middleware2Responder)

      it 'should have passed correct next to middlware2', ->
        expect(middleware2NextVal).toBeUndefined()

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

