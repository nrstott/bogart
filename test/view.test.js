var
  bogart = require('../lib/bogart'),
  view   = require('../lib/view'),
  jsgi   = require('jsgi'),
  sys    = require('sys'),
  when   = require('jsgi/promise').when,
  assert = require('assert'),
  rootRequest = {
    headers: {},
    pathInfo: '/',
    method: 'GET',
    jsgi: { version: [0, 3] },
    env: {}
  },
  fixturesDir = process.cwd() + '/test/fixtures';

exports['test render haml'] = function() {
  var app = 
    bogart.app(function(show) {
      
      this.setting('views', fixturesDir);

      show('/', function(req, resp) {
        return resp.render('index.haml', { layout: false });
      });
    });

  var resp = app(rootRequest);

  return when(resp, 
    function(val) {
      var body = '';

      return when(val.body.forEach(function(x) { body += x }), 
        function() {
          sys.puts('assert body');
          assert.equal(body, ['<h1>Hello World</h1>']);
        });
    });
}

exports['test render mustache'] = function() {
  var app =
    bogart.app(function(show) {
      this.setting('views', fixturesDir);

      show('/', function(req, resp) {
        return resp.render('index.mustache', { layout: false });
      });
    });

  var resp = app(rootRequest);

  return when(resp,
    function(val) {
      var body = '';
      return when(val.body.forEach(function(x) { body += x }),
        function() {
          sys.puts('assert body');
          assert.equal(body, ['<h1>Hello World from Mustache</h1>\n']);
        });
    });
}

if(require.main == module) {
  require("patr/runner").run(exports);
}