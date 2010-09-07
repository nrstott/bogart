var bogart = require('../../lib/bogart');

var config = function(show, create, update, destroy) {
  show('/hello/:name', function(req, name) {
    return bogart.html('Hello '+name);
  });
};

bogart.start(bogart.router(config));
