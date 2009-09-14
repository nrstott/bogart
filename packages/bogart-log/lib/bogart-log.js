var fs = require("file");
var sys = require("system");

var bogartEnvironment = sys.env["BOGART_ENV"] || "development";

var bogartRoot = fs.cwd();

var configDir = fs.join(bogartRoot, "config");
var configFile = fs.join(configDir, "log.json");

var logDir = fs.join(bogartRoot, "log");
var logFile = fs.join(logDir, bogartEnvironment.toLowerCase());

if (!fs.exists(logDir))
    fs.mkdir(logDir);

if (!fs.exists(logFile))
    fs.touch(logFile);

exports.error = function(message){
    fs.write(logFile, message, { append: true, write: true, exclusive: true });
};

exports.debug = function(message) {
    fs.write(logFile, message, { append: true, write: true, exclusive: true });
};