Resource = require '../lib/resource'
NotImplementedError = Resource.NotImplementedError;

describe 'Resource', ->

  it 'should have a router', ->
    expect(new Resource('foo').router).toBeDefined();

  describe 'register routes', ->
    resource = null
    router = null

    beforeEach ->
      resource = new Resource('foo')
      router = resource.router

    it 'should register list route', ->
      listLink = resource.listLink()
      expect(router.handler(listLink.method, listLink.url)).not.toBeNull();

    it 'should register show route', ->
      showLink = resource.showLink(':id')
      expect(router.handler(showLink.method, showLink.url)).not.toBeNull();

    it 'should register create route', ->
      createLink = resource.createLink()
      expect(router.handler(createLink.method, createLink.url)).not.toBeNull()

    it 'should register update route', ->
      updateLink = resource.updateLink()
      expect(router.handler(updateLink.method, updateLink.url)).not.toBeNull()

    it 'should register edit route', ->
      editLink = resource.editLink()
      expect(router.handler(editLink.method, editLink.url)).not.toBeNull()

    it 'should register new route', ->
      newLink = resource.newLink()
      expect(router.handler(newLink.method, newLink.url)).not.toBeNull()

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
      expect(resource.format['application/json']).toHaveBeenCalledWith(req, { foo: 'bar', bleh: 'blah', links: jasmine.any(Object) })

    it 'should add links to response', ->
      expect(res.links).toBeDefined();

  describe 'URL helpers', ->
    resource = null

    link = (url, method = 'get') ->
      result =
        url: url,
        method: method

    expectLink = (actual, url, method = 'get') ->
      expect(actual).toEqual(link(url, method))

    beforeEach ->
      resource = new Resource('foo')

    it 'shoudl have correct listLink', ->
      expectLink resource.listLink(), "/foos"

    it 'should have correct showLink', ->
      id = '123'
      expectLink resource.showLink(id), "/foo/#{id}"

    it 'should have correct createLink', ->
      expectLink resource.createLink(), '/foo', 'post'

    it 'should have correct updateLink', ->
      id = '123'
      expectLink resource.updateLink(id), "/foo/#{id}", 'put'

    it 'should have correct destroyLink', ->
      id = '123'
      expectLink resource.destroyLink(id), '/foo/'+id, 'delete'

    it 'should have correct newLink', ->
      expectLink resource.newLink(), '/foo/new'

    it 'should have correct editLink', ->
      id = '123'
      expectLink resource.editLink(id), "/foo/edit/#{id}"
