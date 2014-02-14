bogart = require '../lib/bogart'
assert = require 'assert'
MockRequest = require './helpers/JsgiRequestHelper'
q = require 'q'


describe 'parameter validation', ->
	it 'should require a string domain pattern parameter', () ->
		expect(() -> 
			bogart.middleware.domainParameters(/stuff/g)
		).toThrow(new Error('domainPattern must be a string'))

	it 'should reject domain patterns with * wildcard characters', () ->
		expect(() ->
			bogart.middleware.domainParameters(':tenant.*.com')
		).toThrow(new Error('domain pattern may not contain wildcards (*)'))

	it 'should not throw with valid parameters', ->
		expect(() ->
			bogart.middleware.domainParameters("this.is.valid.com")
		).not.toThrow()


describe 'request body definition', ->
	req = undefined

	beforeEach (done) ->
		domainParameters = bogart.middleware.domainParameters(':tenant.bogart.local')
		req = MockRequest.domain('does.not.match')
		domainParameters(req, ()-> done() )

	it 'should define a request body', ->
		expect(req.body).not.toBe(undefined)

	it 'should not match any parameters', ->
		expect(Object.keys(req.body).length).toBe(0)


describe 'request body guard', ->
	req = undefined

	beforeEach (done) ->
		domainParameters = bogart.middleware.domainParameters(':tenant.bogart.local')
		req = MockRequest.domain('this.does.not.match', {foo: "bar"})

		domainParameters(req, ()-> done())

	it 'should respect the existing request body', ->
		expect(req.body.foo).toBe('bar')


describe 'extracts parameters', ->
	it 'should extract the subdomain', (done) ->
		handler = (req) ->
			expect(req.body.tenant).toBe('jdc0589')
			done();

		domainParameters = bogart.middleware.domainParameters(':tenant.bogart.local')
		req = MockRequest.domain('jdc0589.bogart.local')

		domainParameters(req, handler)
	
	it 'should extract the port by default', (done) ->
		handler = (req) ->
			expect(req.body.port).toBe(1337)
			done()

		domainParameters = bogart.middleware.domainParameters('bogart.local')
		req = MockRequest.domain('bogart.local:1337')

		domainParameters(req, handler)
	
	it 'should extract multiple parameters', (done) ->
		handler = (req) ->
			expect(req.body).toEqual {
				'tenant': 'jdc0589',
				'subdomain': 'api',
				'domain': 'bogart',
				'tld': 'io',
				'port': 8080
			}
			done()

		domainParameters = bogart.middleware.domainParameters(':tenant.:subdomain.:domain.:tld')
		req = MockRequest.domain('jdc0589.api.bogart.io:8080')

		domainParameters(req, handler)
