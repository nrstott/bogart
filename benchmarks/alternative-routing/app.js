var
   bogart =       require('../../lib/bogart'),
   router =       require('./alt-router'),
   sys =          require('sys');

var config = function(show, create, update, destroy) {
  show('/hello/@firstname/@lastname', function(req, fname, lname) {
    return bogart.html('Hello '+fname + " "+lname);
  });

//  show('/stream', function(req) {
//    var streamer = bogart.stream();
//
//    setInterval(function() {
//      var currentTime = new Date();
//      streamer(currentTime.getHours()+':'+currentTime.getMinutes()+':'+currentTime.getSeconds()+"\n");
//    }, 10);
//
//    setTimeout(function() {
//      streamer.end();
//    }, 10000);
//
//    return streamer.respond();
//  });

show('/1179/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/9398/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/680/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/8617/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/4008/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/1425/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/9404/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/3896/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/7512/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/3543/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/5685/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/2109/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/332/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/8617/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/6889/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/8274/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/8289/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/4454/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/4305/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/5223/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/4602/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/3084/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/1491/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/2727/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/4104/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/664/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/2042/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/4168/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/2583/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/490/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/6060/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/9095/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/3441/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/8376/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/8906/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/4239/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/2094/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/2338/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/8557/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/6740/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/1321/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/3768/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/7059/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/1431/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/9329/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/5440/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/4610/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/2181/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/6647/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/2342/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/7792/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/7018/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/113/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/3956/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/6116/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/1305/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/3673/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/1411/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/7164/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/6766/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/9508/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/9726/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/7935/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/9898/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/4478/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/5212/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/1110/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/3937/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/2833/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/4712/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/4554/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/233/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/255/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/3202/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/8267/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/6722/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/1157/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/2224/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/4185/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/5762/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/1187/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/2963/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/1876/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/8034/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/2134/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/5503/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/9011/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/565/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/5069/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/5060/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/2986/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/2009/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/1376/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/8790/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/8756/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/9349/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/1622/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/1899/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/9071/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
show('/6736/@fname/@lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });
  

  
};

bogart.start(router.init(config));