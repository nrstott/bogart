var middleware = require("../middleware");

const   PATH_PARAMS = /:([\w\d]+)/g,
        PATH_PARAMETER_REPLACEMENT = "([^\\.]+)";

module.exports = function(domainPattern, nextApp) {
    if(typeof domainPattern !== "string") {
        throw new Error("domainPattern must be a string");
    }

    if(domainPattern.indexOf("*") > -1) {
        throw new Error("domain pattern may not contain wildcards (*)");
    }

    if(typeof nextApp !== "function") {
        throw new Error("nextApp must be definfed");
    }

    var self = this,
        paramNames = domainPattern.match(PATH_PARAMS) || [];

    var strPattern = '^' + domainPattern
        .replace(/\./, '\\.')
        .replace(PATH_PARAMS, PATH_PARAMETER_REPLACEMENT) + "$";

    self.domainPattern = new RegExp(strPattern);
    self.paramNames = paramNames.map(function(x) {
        return x.substring(1);
    });

    return function(req) {
        var host = req.headers["host"];
        req.env.domain = req.env.domain || {};

        // handle port specification. always assigned to req.env.domain.port
        var startPort = host.indexOf(':');
        if (startPort > -1) {
            req.env.domain.port = parseInt(host.slice(startPort + 1), 10);
            host = host.substring(0, startPort);
        }

        var parts = self.domainPattern.exec(host) || [];

        // first match is the complete input match
        parts.shift();

        parts.forEach(function(part, idx) {
            if (idx < self.paramNames.length) {
                req.env.domain[self.paramNames[idx]] = part;
            }
        });

        return nextApp(req);
    };
};