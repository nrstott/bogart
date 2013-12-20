Form = require '../lib/form'
MockRequest = require './helpers/JsgiRequestHelper'
q = require '../lib/q'
ViewEngine = require('../lib/view').ViewEngine
EventEmitter = require('events').EventEmitter

describe 'Form', ->

  it 'should construct', ->
    expect(new Form()).not.toBeUndefined()

  it 'should set viewEngine', ->
    viewEngine = new EventEmitter();

    expect(new Form().viewEngine(viewEngine).viewEngine()).toBe(viewEngine)

  it 'should set selector', ->
    selector = {}
    
    expect(new Form().selector(selector).selector()).toBe(selector)
  
  it 'should have default selector', ->
    expect(new Form().selector()).toBe('form')

  describe 'GET request', ->
    form = null
    validationOptions = null
    viewEngine = null
    afterRender = null
    next = null
    res = null
    req = null

    beforeEach ->
      validationOptions =
        fields:
          email: [ { isValid:"required", message:"Email is required"},
                   { isValid:"email", message:"Email must be valid"} ]

      viewEngine = new ViewEngine('mustache')
      spyOn(viewEngine, 'cache').andReturn('hello world')

      afterRender = jasmine.createSpy('afterRender')
      viewEngine.on('afterRender', afterRender)

      next = jasmine.createSpy 'next'
      next.andCallFake (req) ->
        viewEngine.respond 'index.mustache'

      req = MockRequest.root()

      form = new Form(validationOptions).viewEngine(viewEngine)

      res = form(next)(req)

    it 'should call next', (done) ->
      res
        .then ->
          expect(next).toHaveBeenCalled()
        .fail (err) =>
          @fail(err)
        .fin done

    it 'should add formwarden_script to locals', (done) ->
      res
        .then ->
          expect(afterRender.mostRecentCall.args[1].locals.formwardenScript).not.toBeUndefined()
        .fail (err) =>
          @fail(err)
        .fin done



