/**
 * Bogart Jade View Engine Example.
 *
 * In order for this example to work, bogart-jade must be installed.
 * npm install bogart-jade
 */

var bogart = require('../../lib/bogart')
  , path   = require('path');

require('bogart-jade');

// Construct a Bogart ViewEngine using the Jade.
var viewEngine = bogart.viewEngine('jade');

var router = bogart.router();
router.get('/', function(req) {
  return viewEngine.respond('index.jade', { locals: { description: 'This is content' } });
});

var app = bogart.app();

// Framewokrs are better with batteries! Setup a batteries-included JSGI stack.
app.use(bogart.middleware.error);

// Add our router to the application stack. It is important that this be done after 
// adding bogart.batteries so that batteries is ahead of router in the middleware 
// chain.
app.use(router);

app.start(9091, '127.0.0.1');
