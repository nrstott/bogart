JsgiRequest = require '../../helpers/JsgiRequestHelper'
CookieDataProvider = require '../../../lib/middleware/session/cookieDataProvider'
uuid = require 'node-uuid'
q = require '../../../lib/q'

describe 'Cookie Data Provider', ->

  describe 'load session', ->
    cookieDataProvider = null
    sessionId = null
    encryptionKey = null
    decryptedSessionData = null
    session = null

    beforeEach ->
      encryptionKey = uuid()
      sessionId = 1293

      req = new JsgiRequest('/', 'get', { cookie: 'bogart_session_data={}' })

      encrypt = jasmine.createSpy 'encrypt'
      decrypt = jasmine.createSpy 'decrypt'

      encrypt.andReturn 'bogart_session_data'

      decryptedSessionData = '{}'
      decrypt.andReturn decryptedSessionData

      cookieDataProvider = new CookieDataProvider({
        secret: encryptionKey,
        encrypt: encrypt,
        decrypt: decrypt
      });

      session = cookieDataProvider.loadSession req, sessionId

    it 'should call encrypt', (done) ->
      q.when session, (session) ->
        expect(cookieDataProvider.encrypt).toHaveBeenCalled()
        done()

    it 'should call decrypt', (done) ->
      q.when session, (session) ->
        expect(cookieDataProvider.decrypt).toHaveBeenCalled()
        done()

    it 'should have correct session data', (done) ->
      q.when session, (session) ->
        expect(session).toEqual JSON.parse(decryptedSessionData)
        done()

  describe 'destroy session', ->
    res = null
    sessionId = null
    encrypt = null

    beforeEach ->
      sessionId = '--some-session-id--'

      encrypt = jasmine.createSpy 'encrypt'
      encrypt.andCallFake (sessionId, secret) ->
        sessionId

      cookieDataProvider = new CookieDataProvider
        secret: 'VERY_SECRET',
        encrypt: encrypt

      req = new JsgiRequest('/', 'get', { cookie: '' })
      req.env =
        session:
          foo: 'bar'
          bar: 'baz'

      res = { headers: {} }
      res = cookieDataProvider.destroy(req, res, sessionId)

    it 'should call encrypt', (done) ->
      q(res)
        .then ->
          expect(encrypt).toHaveBeenCalled()
        .fail (err) =>
          @fail err
        .fin done

    it 'should have empty session cookie', (done) ->
      q(res)
        .then (res) ->
          cookie = res.headers['Set-Cookie'][0]
          parts = cookie.split(';')
          val = parts[0].split('=')[1]
          expect(val).toEqual('')
        .fail (err) =>
          @fail err
        .fin done
