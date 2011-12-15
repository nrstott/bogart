var Q = require('promised-io/lib/promise'),
    when = Q.when,
    DefaultIdProvider = require("./idProvider").IdProvider,
    DefaultDataProvider = require("./dataProvider").DataProvider;

exports.Session = function(config, nextApp) {
    if (nextApp === undefined) {
        nextApp = config;
        config = {};
    }

    config = config || {};
    config.options = config.options || {};
    config.options.idProvider = config.options.idProvider || {};
    config.options.dataProvider = config.options.dataProvider || {};
    config.options.idProvider.lifetime = config.lifetime || undefined;
    config.options.dataProvider.lifetime = config.lifetime || undefined;

    var idProvider = config.idProvider || new DefaultIdProvider(config.options.idProvider);
    var dataProvider = config.dataProvider || new DefaultDataProvider(config.options.dataProvider);

    return function(req) {
        var sessionId = idProvider.getSessionId(req);
        return when(dataProvider.loadSession(req, sessionId), function() {
            return when(nextApp(req), function(res) {
                res = idProvider.save(req, res, sessionId) || res;
                
                return when(dataProvider.save(req, res, sessionId), function(dpResp) {
                	return dpResp || res;
                });
            });
        });
    };
};

exports.Session.DefaultIdProvider = DefaultIdProvider;
exports.Session.DefaultDataProvider = DefaultDataProvider;