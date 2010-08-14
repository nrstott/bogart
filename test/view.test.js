var
  bogart = require('../lib/bogart'),
  view   = require('../lib/view'),
  jsgi   = require('jsgi'),
  sys    = require('sys'),
  when   = require('promised-io/promise').when,
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
  var viewEngine = bogart.viewEngine('haml', bogart.maindir()+'/fixtures');
  
  return when(viewEngine.render('index.haml', { layout: false }), function(str) {
    assert.equal(str, '<h1>Hello World</h1>');
  });
}

exports['test render mustache'] = function() {
  var viewEngine = bogart.viewEngine("mustache", bogart.maindir()+'/fixtures');
  
  return when(viewEngine.render('index.mustache', { layout: false }), function(str) {
    assert.equal(str, '<h1>Hello World from Mustache</h1>\n');
  });
}

if(require.main == module) {
  require("patr/runner").run(exports);
}
