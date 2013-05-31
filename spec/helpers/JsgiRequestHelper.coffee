_ = require 'underscore'

class MockJsgiRequest
  this.root = () ->
    new RootRequest()

  constructor: (@pathInfo, @method = 'get', @headers = {}) ->

class RootRequest extends MockJsgiRequest
  constructor: (method, headers) ->
    super('/', method, headers)

module.exports = MockJsgiRequest