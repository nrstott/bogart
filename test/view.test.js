var
  bogart = require('../lib/bogart'),
  view   = require('../lib/view'),
  jsgi   = require('jsgi'),
  sys    = require('sys'),
  when   = require('jsgi/promise').when,
  rootRequest = {
    pathInfo: '/',
    method: 'GET',
    jsgi: { version: [0, 3] },
    env: {}
  }

exports['test render haml'] = function(assert, beforeExit) {
  var app = 
    bogart.app(function(show) {
      
      this.setting('views', __dirname + '/fixtures')

      show('/', function(req, resp) {
	return resp.render('index.haml')
      })
    })  

  var resp = app(rootRequest)

  when(resp, 
    function(val) {
      var body = ''

      when(val.body.forEach(function(x) { body += x }), 
        function() {
          sys.puts('assert body')
	  assert.equal(body, ['<h1>Hello World</h1>'])
        })
    })
}

exports['test render mustache'] = function(assert, beforeExit) {
  var app =
    bogart.app(function(show) {
      this.setting('views', __dirname + '/fixtures')

      show('/', function(req, resp) {
	return resp.render('index.mustache')
      })
    })

  var resp = app(rootRequest)

  when(resp,
    function(val) {
      var body = ''
      when(val.body.forEach(function(x) { body += x }),
	function() {
	  sys.puts('assert body')
	  assert.equal(body, ['<h1>Hello World from Mustache</h1>\n'])
	})
    })
}
