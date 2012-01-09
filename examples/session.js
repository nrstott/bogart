var bogart = require('../lib/bogart');

var router = bogart.router();

router.get('/', function(req) {
  req.session("foo", "bar");

  var session = "Session: <br /><ul>";

  req.session.keys().forEach(function(key) {
    session += "<li>"+key+": "+req.session(key)+"</li>";
  });

  session += "</ul>";

  return bogart.html(session);
});

var sessionConfig = {
  lifetime: 600
};

var app = bogart.app();
app.use(bogart.middleware.session(sessionConfig));
app.use(router);

app.start();