var bogart       = require('../lib/bogart')
  , view         = require('../lib/view')
  , jsgi         = require('jsgi')
  , when         = require('promised-io/lib/promise').when
  , path         = require('path')
  , test         = require('tap').test
  , plan         = require('tap').plan
  , fixturesPath = path.join(__dirname, 'fixtures');

test('test render mustache', function(t) {
  var viewEngine = bogart.viewEngine('mustache', fixturesPath);
  
  when(viewEngine.render('index.mustache', { layout: false }), function(str) {
    t.equal(str, '<h1>Hello World from Mustache</h1>');;
    t.end();
  }, function(err) {
    t.fail(err);
  });
});

test('test render mustache with partials', function(t) {
  var viewEngine = bogart.viewEngine('mustache', fixturesPath);
  
  when(viewEngine.render('partial-test.mustache', { layout: false, locals: { greeting: {} }, partials: { greeting: 'greeting.mustache' } }), function(str) {
    t.equal(str, "<h1>Hello World from Mustache</h1><p>With Partial</p>");
    t.end();
  }, function(err) {
    t.fail(err);
  });
});
