var bogart = require('../lib/bogart');

var config = function(show, create, update, destroy) {
  show('/flash/:key/:value', function(req, name) {
    var existing  = "Existing Flash: <br />";
    return bogart.html(existing);
  });
};


var app = bogart.middleware.Flash({}, bogart.router(config));
bogart.start(app, {port:1337});