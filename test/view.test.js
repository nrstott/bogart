var bogart = require('../lib/bogart')
  , view   = require('../lib/view')
  , jsgi   = require('jsgi')
  , when   = require('q').when
  , assert = require('assert')
  , fixturesDir = process.cwd() + '/test/fixtures';

exports['test render haml'] = function(beforeExit) {
  var viewEngine = bogart.viewEngine('haml', __dirname+'/fixtures')
    , renderedText;
  
  when(viewEngine.render('index.haml', { layout: false }), function(str) {
    renderedText = str;
  });

  beforeExit(function() {
    assert.equal(renderedText, '<h1>Hello World</h1>');
  });
};

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

exports['test render jade'] = function(beforeExit) {
  var viewEngine = bogart.viewEngine('jade', __dirname+'/fixtures')
    , renderedText;
  
  when(viewEngine.render('index.jade', { layout: false }), function(str) {
    renderedText = str;
  });

  beforeExit(function() {
    assert.equal(renderedText, '<h1>Hello World from Jade</h1>');
  });
}
