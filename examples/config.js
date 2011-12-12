/**
 * Bogart `config` example.
 *
 * Environment is determined by the OS environment variable BOGART_ENV.
 * The default value for environment if BOGART_ENV is not set is 'development'. 
 */

var bogart = require('../lib/bogart');

function developmentApp() {
  return function(req) {
    return 'You are running in development mode.';
  };
};

function productionApp() {
  return function(req) {
    return 'You are running in production mode.';
  };
};

var app = bogart.app();

bogart.config(function() {
  // Executed in all environments.
  app.use(bogart.batteries);
});

bogart.config('development', function() {
  app.use(developmentApp);
});

bogart.config('production', function() {
  app.use(productionApp);
});

app.start();