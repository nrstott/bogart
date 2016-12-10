_ = require 'underscore'

class MockJsgiRequest
  this.root = () ->
    new RootRequest()

  this.domain = (domain) ->
  	new DomainRequest(domain)

  constructor: (@pathInfo, @method = 'get', @headers = {}, @env = {}) ->


class RootRequest extends MockJsgiRequest
  constructor: (method, headers) ->
    super('/', method, headers)


class DomainRequest extends MockJsgiRequest
	constructor: (domain) ->
		super('/', 'get', { "host": domain })


module.exports = MockJsgiRequest