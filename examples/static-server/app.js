var bogart = require("../../lib/bogart");
var path = require("path");

var root = path.join(__dirname, "public");

var app = bogart.app();
app.use(bogart.middleware.directory(root));

app.get("/", function(req) {
  return bogart.html("<html><body><img src='/images/ninja-cat.jpg' /></body></html>");
});

app.start();
