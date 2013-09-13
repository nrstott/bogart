Password = require '../../../lib/middleware/auth/password'
JsgiRequest = require '../../helpers/JsgiRequestHelper'
q = require 'q'
_ = require 'underscore'

describe 'Password strategy', ->
  it 'should construct', ->
    expect(new Password()).not.toBeUndefined()

  describe 'GET /login', ->
    password = null
    strategy = null
    res = null

    beforeEach ->
      strategy =
        views: jasmine.createSpyObj 'views', [ 'login' ]

      strategy.views.login.andReturn 'some login form';

      password = new Password(strategy)
      res = password()(new JsgiRequest '/login')

    it 'should call `strategy.views.login`', (done) ->
      q.when res, ->
        expect(strategy.views.login).toHaveBeenCalled()
        done()

    it 'should have status 200', (done) ->
      q.when res, (res) ->
        expect(res.status).toBe(200)
        done()

  describe 'overriding login path', ->
    password = null
    strategy = null
    res = null

    beforeEach ->
      strategy =
        loginPath: '/auth/l'
        views: jasmine.createSpyObj 'views', [ 'login' ]

      password = new Password(strategy)
      res = password()(new JsgiRequest strategy.loginPath)

    it 'should call `strategy.views.login`', (done) ->
      q.when res, ->
        expect(strategy.views.login).toHaveBeenCalled()
        done()

  describe 'POST /login with valid credentials', ->
    strategy = null
    password = null
    res = null
    session = null
    user = null

    beforeEach ->
      strategy =
        verifyCredentials: jasmine.createSpy 'verify credentials'
        getUser: jasmine.createSpy 'get user'
        serializeUser: jasmine.createSpy 'serialize user'
        sessionUserKey: 'user'

      user =
        firstName: 'my'
        lastName: 'user'
        email: 'my@user.com'

      strategy.serializeUser.andReturn user

      strategy.verifyCredentials.andReturn q.resolve(true)

      req = new JsgiRequest '/login', 'post'
      req.body = { login: 'myLogin', password: 'myPassword' }
      session = req.session = jasmine.createSpy 'session'

      password = new Password(strategy)
      res = password()(req)

    it 'should verify credentials', (done) ->
      q.when res, ->
        expect(strategy.verifyCredentials).toHaveBeenCalledWith('myLogin', 'myPassword')
        done()
      , (err) =>
        this.fail err
        done()

    it 'should getUser', (done) ->
      q.when res, ->
        expect(strategy.getUser).toHaveBeenCalledWith('myLogin')
        done()

    it 'should add user to session', (done) ->
      q.when res, ->
        expect(session).toHaveBeenCalledWith('user', user)
        done()

    it 'should redirect', (done) ->
      q.when res, (res) ->
        expect(res.status).toBe(302)
        done()

  describe 'POST /login with invalid credentials', ->
    strategy = null
    res = null

    beforeEach ->
      strategy = 
        verifyCredentials: jasmine.createSpy 'verify credentials'

      strategy.verifyCredentials.andReturn q.resolve(false)

      password = new Password(strategy)

      res = password()(new JsgiRequest('/login', 'post'))

    it 'should verify credentials', (done) ->
      q.when res, ->
        expect(strategy.verifyCredentials).toHaveBeenCalled()
        done()

    it 'should redirect to GET /login with invalid login error', (done) ->
      q.when res, (res) ->
        expect(res.status).toBe(302)
        expect(res.headers.location).toBe('/login?errors=["Invalid login or password"]')
        done()

  describe 'GET /register', ->
    strategy = null
    res = null

    beforeEach ->
      strategy =
        views: jasmine.createSpyObj 'views', [ 'register' ]

      strategy.views.register.andReturn 'register page'

      password = new Password(strategy)

      res = password()(new JsgiRequest '/register')

    it 'should have status 200', (done) ->
      q.when res, (res) ->
        expect(res.status).toBe(200)
        done()

    it 'should call strategy.views.register', (done) ->
      q.when res, ->
        expect(strategy.views.register).toHaveBeenCalled()
        done()
