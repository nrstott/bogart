/**
 * Include Modules.
 */
var bogart = require('../../lib/bogart')
  , path   = require('path');

// Create a Bogart ViewEngine.
var viewEngine = bogart.viewEngine('mustache', path.join(bogart.maindir(), 'views'));

// Create a Bogart Router.
var router = bogart.router()

// Add a route to handle the path "/" to the router.
router.get('/', function(req, res) {
  return viewEngine.respond('index.html', { locals: { description: 'This is content' } });
});

// Create a Bogart Application.
var app = bogart.app();

// Add the router to the Application.
app.use(router);

// Start the Application.
app.start();