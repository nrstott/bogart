bogart = require '../lib/bogart'

describe 'bogart app', ->
  app = null

  beforeEach ->
    app = bogart.app()

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

