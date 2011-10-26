var bogart = require('../lib/bogart');
var i = 0;

var config = function(show, create, update, destroy) {
  show('/flash/:key/:value', function(req, name) {
    var existing  = "Existing Flash:"+ req.env.flash["foo"] +"<br />";
    req.flash({
      "foo": i++
    });
    return bogart.html(existing);
  });
};


var app = bogart.middleware.Flash({}, bogart.router(config));
bogart.start(app, {port:1337});