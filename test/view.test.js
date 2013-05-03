var bogart       = require('../lib/bogart')
  , view         = require('../lib/view')
  , jsgi         = require('jsgi')
  , when         = bogart.q.when
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

test('test `bogart.respond` merges headers', function(t) {
  var viewEngine = bogart.viewEngine('mustache', fixturesPath)
    , headers = { abc: 123 }
    , respondOpts = {
        layout: false,
        locals: { greeting: {} },
        headers: headers
      };

  when(viewEngine.respond('partial-test.mustache', respondOpts), function(response) {
    t.equals(response.headers.abc, headers.abc);
    t.equals(response.headers['content-type'], 'text/html');

    t.end();
  }, function(err) {
    t.fail(err);
    t.end();
  });

  t.plan(2);
});