bogart = require '../lib/bogart'
path = require 'path'
q = bogart.q
security = require '../lib/security'

describe 'security', ->
  dec = null
  plain = null

  beforeEach ->
    plain = "this is a very long string of text with random characters {}[[]\!@#$%^&*()_+!@#$%^&*()_+%3D%44%5Z,this is a very long string of text with random characters {}[[]\!@#$%^&*()_+!@#$%^&*()_+%3D%44%5Z,this is a very long string of text with random characters {}[[]\!@#$%^&*()_+!@#$%^&*()_+%3D%44%5Z,this is a very long string of text with random characters {}[[]\!@#$%^&*()_+!@#$%^&*()_+%3D%44%5Z";

  describe 'default key', ->
    beforeEach ->
      enc = security.encrypt plain
      dec = security.decrypt enc

    afterEach ->
      dec = null

    it 'should have decrypted original message', ->
      expect(dec).toBe plain

  describe 'provided key', ->
    beforeEach ->
      key = "THIS is a Secret -- key == C!@#$%^&*())_%3D%2F"

      enc = security.encrypt plain, key
      dec = security.decrypt enc, key

    afterEach ->
      dec = null

    it 'should have decrypted original message', ->
      expect(dec).toBe plain

  describe 'uuid key', ->
    beforeEach ->
      key = "0ce05d12-1a33-11e1-a436-0019e34411d1"

      enc = security.encrypt plain, key
      dec = security.decrypt enc, key

    afterEach ->
      dec = null

    it 'should have decrypted original message', ->
      expect(dec).toBe plain
      
describe 'promisify', ->

  describe 'given success', ->
    expectedVal = 1
    res = null

    beforeEach ->
      asyncFn = (cb) ->
        process.nextTick ->
          cb null, expectedVal

      res = bogart.promisify(asyncFn)()

    it 'should have corrected resolution', (done) ->
      q.when res, (res) ->
        expect(res).toBe expectedVal
        done()

  describe 'given rejection', ->
    res = null
    expectedRejection = new Error('bad stuff happened')

    beforeEach ->
      asyncFn = (cb) ->
        process.nextTick ->
          cb expectedRejection

      res = bogart.promisify(asyncFn)()

    it 'should have correct rejection', (done) ->
      q.when(res).fail (err) ->
        expect(err).toBe expectedRejection
        done()


