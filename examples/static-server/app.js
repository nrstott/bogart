var
  bogart = require("../../lib/bogart");

var router = bogart.router(function(get) {
  get("/", function(req) {
    return bogart.html("<html><body><img src='/images/ninja-cat.jpg' /></body></html>");
  });
});

var root = bogart.maindir()+"/public/";

bogart.start(bogart.middleware.serveStatic({ "urls": [ "" ], "root": root }, router));
