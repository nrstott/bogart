var
  bogart = require('../lib/bogart'),
  view   = require('../lib/view'),
  jsgi   = require('jsgi'),
  sys    = require('sys'),
  when   = require('jsgi/promise').when

exports['test render'] = function(assert, beforeExit) {
  var app = 
    bogart.app(function(show) {
      
      this.setting('views', __dirname + '/fixtures')

      show('/', function(req, resp) {
	return resp.render('index.haml')
      })
    })  

  var resp = app({
    pathInfo: '/',
    method: 'GET',
    jsgi: { version: [0, 3] },
    env: {}
  })

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
