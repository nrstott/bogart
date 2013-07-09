auth = require '../../lib/middleware/auth'
JsgiRequest = require '../helpers/JsgiRequestHelper'
q = require 'q'

describe 'auth', ->

  describe 'adding a strategy without a name', ->
    
    it 'should raise error', ->
      expect(-> auth().use {}).toThrow(new Error('Strategy does not have required property name'))

  describe 'strategy valid for request', ->
    middleware = null
    strategy = null

    beforeEach ->
      strategy = jasmine.createSpyObj 'strategy', [ 'valid', 'authenticate' ]
      strategy.name = 'Strategy'
      strategy.valid.andReturn(true)
      strategy.authenticate.andReturn({})

      middleware = auth(() -> null)
      middleware.use(strategy)

      middleware JsgiRequest.root()

    it 'should call valid', ->
      expect(strategy.valid).toHaveBeenCalled()

    it 'should call authenticate', ->
      expect(strategy.authenticate).toHaveBeenCalled()

describe 'Strategy', ->

  describe 'headers', ->
    simpleStrategy = null
    fooVal = null

    beforeEach ->
      SimpleStrategy = auth.Strategy.extend {
        authenticate: ->
          @headers['foo']
      }

      simpleStrategy = new SimpleStrategy(new JsgiRequest('/', 'get', { 'foo': 'bar' }))
      fooVal = simpleStrategy.authenticate()

    it 'should have headers', ->
      expect(fooVal).toBe 'bar'

  describe 'success', ->
    simpleStrategy = null
    userFromAuthenticate = null

    beforeEach ->
      userFromAuthenticate = { email: 'abc123@thisisafakeaddress.com' }

      SimpleStrategy = auth.Strategy.extend {
        authenticate: ->
          userFromAuthenticate
      }

      simpleStrategy = new SimpleStrategy(JsgiRequest.root())
      simpleStrategy.execute()

    it 'should have correct user', (done) ->
      q.when simpleStrategy.user, (user) ->
        expect(user).toBe userFromAuthenticate
        done()
  
  describe 'rejection', ->
    simpleStrategy = null
    err = null

    beforeEach ->
      err = new Error 'something bad happened'

      SimpleStrategy = auth.Strategy.extend
        authenticate: ->
          q.reject err

      simpleStrategy = new SimpleStrategy JsgiRequest.root()
      simpleStrategy.execute()

    it 'should have correct rejection', (done) ->
      q.when(simpleStrategy.user).fail (err) ->
        expect(err).toBe(err)
        done()


