var bogart = require('../lib/bogart');

var config = function(show, create, update, destroy) {
  show('/hello/:name', function(req, name) {
    return bogart.html('Hello '+name);
  });
  
  show('/stream', function(req) {
    var streamer = bogart.stream();
    
    setInterval(function() {
      var currentTime = new Date();
      streamer(currentTime.getHours()+':'+currentTime.getMinutes()+':'+currentTime.getSeconds()+"\n");
    }, 10);
    
    setTimeout(function() {
      streamer.end();
    }, 10000);
    
    return streamer.respond();
  });
};

bogart.start(bogart.router(config));