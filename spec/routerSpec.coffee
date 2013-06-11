bogart = require '../lib/bogart'
mockRequest = require './helpers/JsgiRequestHelper'
Router = (require '../lib/router').Router
q = require 'q'

describe 'isRouter', ->

  it 'given undefined should return false', ->
    expect(Router.isRouter undefined).toBe false

  it 'given null should return false', ->
    expect(Router.isRouter null).toBe false

describe 'matches parameter', ->
  req = null
  router = null
  res = null
  name = null

  beforeEach ->
    req = mockRequest.root()

    router = bogart.router (get) ->
      get '/hello/:name', (req) ->
        name = req.params.name
        bogart.html 'hello'

    req.pathInfo = '/hello/nathan'

    res = router req

  it 'should have correct status', (done) ->
    q.when res, (res) ->
      expect(res.status).toBe 200
      done()

  it 'should have correct name', (done) ->
    q.when res, (res) ->
      expect(name).toBe 'nathan'
      done()