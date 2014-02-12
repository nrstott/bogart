_ = require 'underscore'

class MockJsgiRequest
  this.root = () ->
    new RootRequest()

  this.domain = (domain, body) ->
  	new DomainRequest(domain, body)

  constructor: (@pathInfo, @method = 'get', @headers = {}, @env = {}, @body) ->


class RootRequest extends MockJsgiRequest
  constructor: (method, headers) ->
    super('/', method, headers)


class DomainRequest extends MockJsgiRequest
	constructor: (domain, body) ->
		super('/', 'get', { "host": domain }, {}, body)


module.exports = MockJsgiRequest