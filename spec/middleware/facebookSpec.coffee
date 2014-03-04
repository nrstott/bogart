facebook = require '../../lib/middleware/facebook'

describe 'parse facebook profile', ->
  rawProfile = null
  parsedProfile = null

  shouldMap = (propertyName, rawValue, parsedValue) ->
    it "should have correct #{propertyName}", ->
      expect(parsedValue()).toBe(rawValue())

  beforeEach ->
    rawProfile =
      id: 'abc123',
      username: 'myusername',
      name: 'myname',
      last_name: 'last_name',
      first_name: 'first_name',
      middle_name: 'middle_name',
      gender: 'M',
      link: 'http://me.facebook.com',
      email: 'hello@test.com'

    parsedProfile = facebook.parseFacebookProfile JSON.stringify(rawProfile)

  shouldMap 'id', (() -> rawProfile.id), (() -> parsedProfile.id)

  shouldMap 'username', (() -> rawProfile.username), (() -> parsedProfile.username)

  shouldMap 'name', (() -> rawProfile.name), (() -> parsedProfile.displayName)

  shouldMap 'last_name', (() -> rawProfile.last_name), (() -> parsedProfile.name.familyName)

  shouldMap 'first_name', (() -> rawProfile.first_name), (() -> parsedProfile.name.givenName)

  shouldMap 'middle_name', (() -> rawProfile.middle_name), (() -> parsedProfile.name.middleName)

  shouldMap 'gender', (() -> rawProfile.gender), (() -> parsedProfile.gender)

  shouldMap 'profileUrl', (() -> rawProfile.link), (() -> parsedProfile.profileUrl)

  shouldMap 'email', (() -> rawProfile.email), (() -> parsedProfile.emails[0])

