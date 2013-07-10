_ = require 'underscore'

class MockJsgiRequest
  this.root = () ->
    new RootRequest()

  constructor: (@pathInfo, @method = 'get', @headers = {}) ->
    @env = {}
    @host = 'whiteboard-it.com'
    @port = 80
    @scheme = 'http'
    @params = {}

class RootRequest extends MockJsgiRequest
  constructor: (method, headers) ->
    super('/', method, headers)

module.exports = MockJsgiRequest