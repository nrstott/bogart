bogart = require '../lib/bogart'
q = bogart.q
fs = require 'fs'
path = require 'path'

describe 'resolving ResponseBuilder', ->
  responseBuilder = null
  resolveVal = { 'hello': 'world' }

  beforeEach ->
    responseBuilder = new bogart.ResponseBuilder()

    setTimeout ->
      responseBuilder.resolve resolveVal

  it 'should resolve', (done) ->
    q.when responseBuilder, (res) ->
      expect(res).toBe resolveVal
      done()

describe 'rejecting ResponseBuilder', ->
  responseBuilder = null
  rejectVal = null

  beforeEach ->
    rejectVal = new Error('something bad happened')

    responseBuilder = new bogart.ResponseBuilder()

    setTimeout ->
      responseBuilder.reject(rejectVal)

  it 'should reject', (done) ->
    q.when(responseBuilder).fail (err) ->
      expect(err).toBe rejectVal
      done()

describe 'sending a string', ->
  responseBuilder = null
  msg = 'Hello World'

  beforeEach ->
    responseBuilder = bogart.ResponseBuilder()

    responseBuilder.send msg

    responseBuilder.end()

  it 'should have correct body', (done) ->
    q.when responseBuilder, (res) ->
      written = ''

      q.when res.body.forEach((data) ->
        written += data
      ), ->
        expect(written).toBe msg
        done()

describe 'sending a buffer', ->
  responseBuilder = null
  msg = null
  buffer = null

  beforeEach ->
    msg = 'Hello World'
    buffer = new Buffer msg.length
    buffer.write msg

    responseBuilder = new bogart.ResponseBuilder()
    responseBuilder.send buffer
    responseBuilder.end()

  it 'should have correct body', (done) ->
    q.when responseBuilder, (res) ->
      written = ''

      forEachFinished = res.body.forEach (data) ->
        written += data

      q.when forEachFinished, ->
        expect(written).toBe msg
        done()

describe 'sending binary', ->
  responseBuilder = null
  filePath = path.join __dirname, 'fixtures', 'test.jpg'
  stat = fs.statSync filePath
  fileContent = null

  beforeEach ->
    responseBuilder = new bogart.ResponseBuilder()

    fs.readFile filePath, 'binary', (err, content) =>
      this.fail err if err

      fileContent = content
      responseBuilder.send content
      responseBuilder.end()

  it 'should have correct body', (done) ->
    q.when responseBuilder, (res) ->
      written = new Buffer stat.size

      forEachFinished = res.body.forEach (data) ->
        written.write data, 'binary'

      q.when forEachFinished, ->
        expect(written.toString 'binary').toBe fileContent
        done()

