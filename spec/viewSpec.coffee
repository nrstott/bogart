bogart = require '../lib/bogart'
view = require '../lib/view'
jsgi = require 'jsgi'
q = bogart.q
path = require 'path'
fixturesPath = path.join __dirname, 'fixtures'

describe 'render mustache', ->
  res = null

  beforeEach ->
    viewEngine = bogart.viewEngine 'mustache', fixturesPath

    res = viewEngine.render 'index.mustache', { layout: false }

  it 'should have correct html', (done) ->
    q.when res, (res) ->
      expect(res).toBe '<h1>Hello World from Mustache</h1>'
      done()

describe 'render mustache with partials', ->
  res = null

  beforeEach ->
    viewEngine = bogart.viewEngine 'mustache', fixturesPath

    res = viewEngine.render 'partial-test.mustache', {
      layout: false,
      locals: { greeting: {} },
      partials: { greeting: 'greeting.mustache' }
    }

  it 'should have correct html', (done) ->
    q.when res, (res) ->
      expect(res).toBe '<h1>Hello World from Mustache</h1><p>With Partial</p>'
      done()

describe 'given headers to merge', ->
  res = null
  opts = null

  beforeEach ->
    viewEngine = bogart.viewEngine 'mustache', fixturesPath

    opts = {
      layout: false,
      headers: { abc: 123 }
    }

    res = viewEngine.respond 'index.mustache', opts

  it 'should have correct content-type', (done) ->
    q.when res, (res) ->
      expect(res.headers['content-type']).toBe 'text/html'
      done()

  it 'should have correct merged value', (done) ->
    q.when res, (res) ->
      expect(res.headers.abc).toBe opts.headers.abc
      done()
