var util = require('util');

desc("generate a new bogart application skeleton");
task("generate", [], function(dir, name) {
  console.log("generating bogart app in " + dir);
  var fs = require("fs"),
    path = require("path");
  
  dir = dir || ".";
  
  var appTemplate = fs.readFileSync(path.join(__dirname, "cli", "templates", "app.js.template"), 'utf8');
  fs.mkdirSync(dir, 0777);
  fs.writeFileSync(path.join(dir, "app.js"), appTemplate, 'utf8');
  
  var packageJsonTemplate = fs.readFileSync(path.join(__dirname, "cli", "templates", "package.json.template"), 'utf8');
  fs.writeFileSync(path.join(dir, "package.json"), packageJsonTemplate, 'utf8');
});
