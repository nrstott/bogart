var
  bogart = require("../../lib/bogart");

var router = bogart.router(function(get) {
  get("/", function(req) {
    return bogart.html("<html><body><img src='/images/ninja-cat.jpg' /></body></html>");
  });
});

var root = require("path").join(__dirname, "public");

bogart.start(bogart.middleware.Directory(root, router));
