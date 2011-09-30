var bogart = require('../lib/bogart')
  , view   = require('../lib/view')
  , jsgi   = require('jsgi')
  , when   = require('promised-io/lib/promise').when
  , assert = require('assert')
  , fixturesDir = process.cwd() + '/test/fixtures';

exports['test render mustache'] = function(beforeExit) {
  var viewEngine = bogart.viewEngine('mustache', __dirname+'/fixtures')
    , renderedText;
  
  when(viewEngine.render('index.mustache', { layout: false }), function(str) {
    renderedText = str;
  });

  beforeExit(function() {
    assert.equal(renderedText, '<h1>Hello World from Mustache</h1>\n');
  });
};
