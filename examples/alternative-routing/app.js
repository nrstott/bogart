var
   bogart =       require('../../lib/bogart'),
   router =       require('./alt-router'),
   sys =          require('sys');

var config = function(show, create, update, destroy) {
  show('/hello/@firstname/@lastname', function(req, fname, lname) {
    return bogart.html('Hello '+fname + " "+lname);
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

bogart.start(router.init(config));