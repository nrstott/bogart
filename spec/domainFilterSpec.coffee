bogart = require '../lib/bogart'
assert = require 'assert'
MockRequest = require './helpers/JsgiRequestHelper'
q = require 'q'


describe 'parameter validation', ->
	it 'should require a string domain pattern parameter', () ->
		expect(() -> 
			bogart.middleware.domainFilter(/stuff/g, () ->)
		).toThrow(new Error('domainPattern must be a string'))

	it 'should require nextApp', () ->
		expect(() ->
			bogart.middleware.domainFilter 'something.local'
		).toThrow(new Error('nextApp must be definfed'))

	it 'should reject domain patterns with * wildcard characters', () ->
		expect(() ->
			bogart.middleware.domainFilter ':tenant.*.com', () ->
		).toThrow(new Error('domain pattern may not contain wildcards (*)'))


describe 'extracts parameters', ->
	it 'should define req.env.domain',  (done) ->
		handler = (req) ->
			expect(req.env.domain).not.toBe(undefined)
			done()

		domainFilter = bogart.middleware.domainFilter ':tenant.bogart.local', handler
		req = MockRequest.domain('this.does.not.match')

		domainFilter req

	it 'should extract the subdomain', (done) ->
		handler = (req) ->
			expect(req.env.domain.tenant).toBe('jdc0589')
			done();

		domainFilter = bogart.middleware.domainFilter ':tenant.bogart.local', handler
		req = MockRequest.domain 'jdc0589.bogart.local'

		domainFilter req

	it 'should extract the port by default', (done) ->
		handler = (req) ->
			expect(req.env.domain.port).toBe(1337)
			done()

		domainFilter = bogart.middleware.domainFilter 'bogart.local', handler
		req = MockRequest.domain 'bogart.local:1337'

		domainFilter req

	it 'should extract multiple parameters', (done) ->
		handler = (req) ->
			expect(req.env.domain).toEqual {
				'tenant': 'jdc0589',
				'subdomain': 'api',
				'domain': 'bogart',
				'tld': 'io',
				'port': 8080
			}
			done()

		domainFilter = bogart.middleware.domainFilter ':tenant.:subdomain.:domain.:tld', handler
		req = MockRequest.domain 'jdc0589.api.bogart.io:8080'

		domainFilter(req)