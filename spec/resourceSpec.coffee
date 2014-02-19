Resource = require '../lib/resource'
NotImplementedError = Resource.NotImplementedError;

describe 'Resource', ->

  it 'should have a router', ->
    expect(new Resource('foo').router).toBeDefined();

  describe 'routePrefix', ->
    it 'given name that does not start with "/" should prepend "/" to name', ->
      expect(new Resource('foo').routePrefix).toBe('/foo')

    it 'given name that starts with "/" should not prepend "/"', ->
      expect(new Resource('/foo').routePrefix).toBe('/foo')

  describe 'not implemented resource routes', ->
    resource = null

    beforeEach ->
      resource = new Resource('foo')

    it 'list should throw error', ->
      expect(resource.list).toThrow(new NotImplementedError('list'))

    it 'show should throw error', ->
      expect(resource.show).toThrow(new NotImplementedError('show'))

    it 'destroy should throw error', ->
      expect(resource.destroy).toThrow(new NotImplementedError('destroy'))

    it 'new should throw error', ->
      expect(resource.new).toThrow(new NotImplementedError('new'))

    it 'create should throw error', ->
      expect(resource.create).toThrow(new NotImplementedError('create'))

    it 'update should throw error', ->
      expect(resource.update).toThrow(new NotImplementedError('update'))

    it 'edit should throw error', ->
      expect(resource.edit).toThrow(new NotImplementedError('edit'))

  describe 'respond', ->
    resource = null
    req = null
    negotiator = null
    res = null

    beforeEach ->
      req =
        pathInfo: '/foo'
        accepts: [ 'text/html' ]

      negotiator = jasmine.createSpyObj 'negotiator', [ 'preferredMediaType' ]
      negotiator.preferredMediaType.andReturn('application/json')

      Resource.Negotiator = jasmine.createSpy 'Negotiator'
      Resource.Negotiator.andReturn negotiator

      resource = new Resource('foo')
      spyOn(resource.format, 'application/json')

      res =
        foo: 'bar',
        bleh: 'blah'

      resource.respond(req, res)

    it 'should construct Negotiator', ->
      expect(Resource.Negotiator).toHaveBeenCalledWith(req)

    it 'should get preferred media type', ->
      expect(negotiator.preferredMediaType).toHaveBeenCalledWith([ 'application/json', 'text/html' ])

    it 'should format response', ->
      expect(resource.format['application/json']).toHaveBeenCalledWith(req, res)