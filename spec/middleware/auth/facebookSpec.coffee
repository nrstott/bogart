FacebookStrategy = require '../../../lib/middleware/auth/facebook'
JsgiRequest = require '../../helpers/JsgiRequestHelper'
q = require 'q'
_ = require 'underscore'

describe 'FacebookStrategy', ->
  validOptions = {
    id: 'SOMEID',
    secret: 'SOMESECRT'
  }

  it 'should construct', ->
    expect(new FacebookStrategy(JsgiRequest.root(), validOptions)).not.toBeUndefined()

  it 'should use verifyUser parameter', ->
    verifyUser = jasmine.createSpy 'verify user'
    facebookStrategy = new FacebookStrategy(JsgiRequest.root(), validOptions, verifyUser)
    expect(facebookStrategy.verifyUser).toBe verifyUser

  describe 'parseUserProfile', ->
    body = null
    profile = null

    beforeEach ->
      body = {
        id: 'abc123',
        username: 'billy_the_test_user',
        name : 'my display name',
        last_name: 'name',
        first_name: 'my',
        middle_name: 'display',
        gender: 'M',
        link: 'http://link.com',
        email: 'asdf@whiteboard-it.com'
      }

      profile = new FacebookStrategy(JsgiRequest.root(), validOptions).parseUserProfile(JSON.stringify(body))

    it 'should have correct displayName', ->
      expect(profile.displayName).toBe body.name

    it 'should have correct familyName', ->
      expect(profile.familyName).toBe body.last_name

    it 'should have correct givenName', ->
      expect(profile.givenName).toBe body.first_name

    it 'should have correct middleName', ->
      expect(profile.middleName).toBe body.middle_name

    it 'should have correct profileUrl', ->
      expect(profile.profileUrl).toBe body.link

    it 'should have correct emails', ->
      expect(profile.emails).toEqual [ { value: body.email } ]
