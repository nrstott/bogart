request = require '../lib/request'

describe 'construction request given empty object parameter', ->
  req = null
  keys = null

  beforeEach ->
    req = request({})
    keys = Object.keys req

  it 'should have `params`', ->
    expect(keys).toContain 'params'

  it 'should have `search`', ->
    expect(keys).toContain 'search'

  it 'should have `isXMLHttpRequest`', ->
    expect(keys).toContain 'isXMLHttpRequest'

describe 'query string parameters', ->
  jsgiRequest = null
  req = null

  beforeEach ->
    jsgiRequest = { queryString: 'a=1&b=abc' }

    req = request jsgiRequest

  it 'should have correct `queryString`', ->
    expect(req.queryString).toBe jsgiRequest.queryString

  it 'should have correct `search`', ->
    expect(req.search).toEqual { a: '1', b: 'abc' }

describe 'route parameters', ->
  req = null

  beforeEach ->
    req = request {}

    req.routeParams.name = 'Bob'

  it 'should have correct name parameter', ->
    expect(req.params.name).toBe 'Bob'

  it 'should have correct name search parameter', ->
    expect(req.search.name).not.toBe 'Bob'


describe 'XHR request', ->
  req = null

  beforeEach ->
    req = request { headers: { 'x-requested-with': '' } }

  it 'should have correct `isXMLHttpRequest`', ->
    expect(req.isXMLHttpRequest).toBe true

describe 'non-XHR request', ->
  req = null

  beforeEach ->
    req = request { headers: {} }

  it 'should have correct `isXMLHttpRequest`', ->
    expect(req.isXMLHttpRequest).toBe false
