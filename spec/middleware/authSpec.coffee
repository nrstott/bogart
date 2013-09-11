auth = require '../../lib/middleware/auth'
JsgiRequest = require '../helpers/JsgiRequestHelper'
q = require 'q'
_ = require 'underscore'

jasmine.getEnv().defaultTimeoutInterval = 100

describe 'auth', ->

  describe 'adding a strategy without a name', ->
    
    it 'should raise error', ->
      expect(-> auth().use {}).toThrow(new Error('Strategy does not have required property name'))

  describe 'strategy valid for request', ->
    middleware = null
    strategy = null
    userFromAuthenticate = null
    res = null
    req = null

    beforeEach ->
      userFromAuthenticate =
        email: 'tester@somenonexistantplace.com',
        firstName: 'Bob',
        lastName: 'Tester'

      strategy =
        name: 'test-strategy',
        valid: -> true,
        authenticate: ->
          @user = userFromAuthenticate
          q.resolve userFromAuthenticate,
        serializeUser: -> userFromAuthenticate

      spyOn(strategy, 'serializeUser').andCallThrough()
      spyOn(strategy, 'authenticate').andCallThrough()
      spyOn(strategy, 'valid').andCallThrough()

      middleware = auth () -> null
      middleware.use strategy

      req = JsgiRequest.root()
      req.session = jasmine.createSpy 'session'

      res = middleware req

    it 'should call valid', ->
      expect(strategy.valid).toHaveBeenCalled()

    it 'should call authenticate', ->
      expect(strategy.authenticate).toHaveBeenCalled()

    it 'should call serialize user', (done) ->
      q.when res, ->
        expect(strategy.serializeUser).toHaveBeenCalledWith(userFromAuthenticate)
        done()

    it 'should put serialized user in session', (done) ->
      q.when res, ->
        expect(req.session).toHaveBeenCalledWith('user', userFromAuthenticate)
        done()

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
    res = null
    userFromAuthenticate = null

    beforeEach ->
      userFromAuthenticate = { email: 'abc123@thisisafakeaddress.com' }

      SimpleStrategy = auth.Strategy.extend {
        authenticate: ->
          @user = userFromAuthenticate
          @user
      }

      req = JsgiRequest.root()
      req.session = jasmine.createSpy 'session'

      simpleStrategy = new SimpleStrategy(req)
      res = simpleStrategy.execute()

    it 'should have correct user', (done) ->
      q.when res, ->
        expect(simpleStrategy.user).toBe userFromAuthenticate
        done()
  
  describe 'rejection', ->
    simpleStrategy = null
    res = null
    err = null

    beforeEach ->
      err = new Error 'something bad happened'

      SimpleStrategy = auth.Strategy.extend
        authenticate: ->
          q.reject err

      req = JsgiRequest.root()
      req.session = jasmine.createSpy 'session'

      simpleStrategy = new SimpleStrategy req
      res = simpleStrategy.execute()

    it 'should have correct rejection', (done) ->
      q.when(res).fail (err) ->
        expect(err).toBe(err)
        done()

describe 'OAuth2 Strategy', ->
  validOptions =
    id: '123213213213',
    secret: 'abc12',
    authorizationUrl: 'http://somewhere.com/authorization',
    tokenUrl: 'http://somewhere.com/token',
    resourceUrl: 'http://somewhere.com/resource'

  describe 'options', ->
    remove = (key) ->
      opts = _.extend {}, validOptions
      delete opts[key]
      opts

    create = (key) ->
      new auth.OAuth2Strategy(remove key, JsgiRequest.root())

    it 'given no client id should throw error', ->
      expect(() -> create 'id').toThrow(new Error('OAuth2Strategy requires id option'))

    it 'given no client secret should throw error', ->
      expect(() -> create 'secret').toThrow(new Error('OAuth2Strategy requires secret option'))

    it 'given no authorization url should throw error', ->
      expect(() -> create 'authorizationUrl').toThrow(new Error('OAuth2Strategy requires authorizationUrl option'))

    it 'given no client token url should throw error', ->
      expect(() -> create 'tokenUrl').toThrow(new Error('OAuth2Strategy requires tokenUrl option'))

    it 'given no resource url should throw error', ->
      expect(() -> create 'resourceUrl').toThrow(new Error('OAuth2Strategy requires resourceUrl option'))

  describe 'callbackUrl without returnUrl', ->
    url = null

    beforeEach ->
      req = new JsgiRequest('/oauth2/login')

      strategy = new auth.OAuth2Strategy(validOptions, req)

      url = strategy.callbackUrl

    it 'should have correct url', ->
      expect(url).toBe('http://whiteboard-it.com/oauth2/login');

  describe 'authenticate initial request', ->
    strategy = null
    res = null
    authorizeUrlFromOAuth2 = '/some/authorize/url'

    beforeEach ->
      req = new JsgiRequest('/oauth2/login')

      strategy = new auth.OAuth2Strategy(validOptions, req)
      spyOn(strategy.oauth2, 'getAuthorizeUrl').andReturn(authorizeUrlFromOAuth2)

      res = strategy.authenticate()

    it 'should get authorize url', ->
      expect(strategy.oauth2.getAuthorizeUrl).toHaveBeenCalled()

    it 'should have correct status', ->
      expect(res.status).toBe(302)

    it 'should have correct location', ->
      expect(res.headers.location).toBe(authorizeUrlFromOAuth2)

  describe 'authenticate callback from oauth2 provider', ->
    callbackUrl = '/oauth2/login'
    res = null
    OAuth2Client = null
    tokenResponse = null
    userProfile = { id: 123123 }
    strategy = null

    beforeEach ->
      req = new JsgiRequest(callbackUrl)
      req.params.code = 'code'
      req.session = jasmine.createSpy 'session'

      OAuth2Client = jasmine.createSpy 'oauth2 client'
      OAuth2Client.andReturn jasmine.createSpyObj 'oauth2', [ 'getOAuthAccessToken', 'getProtectedResource' ]

      tokenResponse = { accessToken: 'access token', refreshToken: 'refresh token' }

      strategy = new auth.OAuth2Strategy(_.extend({}, validOptions, {
        OAuth2Client: OAuth2Client
      }), req)

      spyOn(strategy, 'parseUserProfile').andReturn(userProfile)
      
      spyOn(strategy, 'verifyUser').andReturn(userProfile)
      
      strategy.oauth2.getOAuthAccessToken.andCallFake (code, opts, cb) ->
        cb(null, tokenResponse.accessToken, tokenResponse.refreshToken)

      strategy.oauth2.getProtectedResource.andCallFake (resourceUrl, accessToken, cb) ->
        cb null, {}, {}

      res = strategy.authenticate()

    it 'should get token', (done) ->
      q.when res, ->
        expect(strategy.oauth2.getOAuthAccessToken)
          .toHaveBeenCalledWith 'code', {
              grant_type: 'authorization_code',
              redirect_uri: 'http://whiteboard-it.com/oauth2/login'
            }, jasmine.any(Function)
        done()

    it 'should get protected resource', (done) ->
      q.when res, ->
        expect(strategy.oauth2.getProtectedResource)
          .toHaveBeenCalledWith(validOptions.resourceUrl, tokenResponse.accessToken, jasmine.any(Function))
        done()

    it 'should verify user profile', (done) ->
      q.when res, ->
        expect(strategy.verifyUser).toHaveBeenCalledWith(userProfile)
        done()
