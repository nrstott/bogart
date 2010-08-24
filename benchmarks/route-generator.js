/*
    USAGE: node route-generator.js [vaiable prefix] [number of routes to generate] >> generated-routes.txt
 */


var head = "show('/",
    tail = "/"+process.argv[2]+"fname/"+process.argv[2]+"lname', function(req, fname, lname) { return bogart.html('Hello '+fname+' '+lname); });";

for(var i = 0; i<process.argv[3]; i++) {
  console.log(head+Math.floor(Math.random()*10000)+tail);
}