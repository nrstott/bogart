var fs = require("file");
var sys = require("system");

var bogartEnvironment = sys.env["BOGART_ENV"] || "development";

var bogartRoot = fs.path(require.main).dirname() + fs.SEPARATOR;

var configDir = bogartRoot + "config" + fs.SEPARATOR;
var configFile = configDir + "log.json";

var logDir = bogartRoot + "log" + fs.SEPARATOR;
var logFile = logDir + bogartEnvironment.toLowerCase();

exports.error = function(message){
    fs.write(logFile, message, { append: true, write: true, exclusive: true });
};
