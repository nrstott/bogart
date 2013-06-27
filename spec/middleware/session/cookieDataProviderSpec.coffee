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
        encryptionKey: encryptionKey,
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
