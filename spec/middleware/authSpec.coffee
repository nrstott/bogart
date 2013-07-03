auth = require '../../lib/middleware/auth'
JsgiRequest = require '../helpers/JsgiRequestHelper'
q = require 'q'

describe 'auth', ->

  describe 'adding a strategy without a name', ->
    
    it 'should raise error', ->
      expect(-> auth().addStrategy {}).toThrow(new Error('Strategy does not have required property name'))

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
      