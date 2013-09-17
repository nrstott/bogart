var Q = require('../../q'),
  when = Q.when,
  DefaultIdProvider = require('./idProvider').IdProvider,
  CookieDataProvider = require('./cookieDataProvider');

exports.Session = function (config, nextApp) {
  if (nextApp === undefined) {

    if (typeof config === 'function') {
      nextApp = config;
      config = {};
    } else {
      return function (nextApp) {
        return exports.Session(config, nextApp);
      };
    }
  }

  config = config || {};
  config.options = config.options || {};
  config.options.idProvider = config.options.idProvider || {};
  config.options.dataProvider = config.options.dataProvider || {};
  config.options.idProvider.lifetime = config.lifetime || undefined;
  config.options.dataProvider.lifetime = config.lifetime || undefined;

  if (config.encryptionKey) {
    config.options.idProvider.encryptionKey = config.encryptionKey;
    config.options.dataProvider.encryptionKey = config.encryptionKey;
  }

  var idProvider = config.idProvider || new DefaultIdProvider(config.options.idProvider);
  var dataProvider = config.dataProvider || new CookieDataProvider(config.options.dataProvider);

  return function (req) {
    var sessionId = idProvider.getSessionId(req);

    return when(dataProvider.loadSession(req, sessionId), function (session) {
      req.env = req.env || {};
      req.env.session = session;

      // set up the session function
      req.session = function () {
        var args = Array.prototype.slice.call(arguments);
        if (args.length === 2) {
          session[args[0]] = args[1];
        } else {
          return session[args[0]];
        }
      };

      req.session.keys = function () {
        return Object.keys(session);
      };

      req.session.hasKey = function (key) {
        return this.keys().filter(function (k) { return k === key; }).length > 0;
      };

      req.session.remove = function (key) {
        delete session[key];
      };

      return when(nextApp(req), function (res) {
        res = idProvider.save(req, res, sessionId) || res;
        
        return when(dataProvider.save(req, res, sessionId), function (dpResp) {
        	return dpResp || res;
        });
      });
    });
  };
};

exports.Session.DefaultIdProvider = DefaultIdProvider;
exports.Session.DefaultDataProvider = CookieDataProvider;