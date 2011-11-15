var bogart       = require('../lib/bogart')
  , view         = require('../lib/view')
  , jsgi         = require('jsgi')
  , when         = require('promised-io/lib/promise').when
  , assert       = require('assert')
  , path         = require('path')
  , fixturesPath = path.join(__dirname, 'fixtures');

exports['test render mustache'] = function(beforeExit) {
  var viewEngine = bogart.viewEngine('mustache', fixturesPath)
    , renderedText;
  
  when(viewEngine.render('index.mustache', { layout: false }), function(str) {
    renderedText = str;
  });

  beforeExit(function() {
    assert.equal(renderedText, '<h1>Hello World from Mustache</h1>');
  });
};

exports['test render mustache with partials'] = function(beforeExit) {
  var viewEngine = bogart.viewEngine('mustache', fixturesPath)
    , renderedText;
  
  when(viewEngine.render('partial-test.mustache', { layout: false, locals: { greeting: {} }, partials: { greeting: 'greeting.mustache' } }), function(str) {
    renderedText = str;
  });

  beforeExit(function() {
    assert.equal(renderedText, '<h1>Hello World from Mustache</h1><p>With Partial</p>');
  });
};
