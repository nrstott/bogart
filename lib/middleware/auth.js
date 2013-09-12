var _ = require('underscore')
  , q = require('q')
  , url = require('url')
  , bogart = require('../bogart')
  , Strategy = require('./auth/strategy')
  , OAuth2Strategy = require('./auth/oauth2')
  , FacebookStrategy = require('./auth/facebook');

var defaultConfig = {
  loginUrl: '/auth/login',
  logoutUrl: '/auth/logout'
};

function Auth(opts, nextApp) {
  if (nextApp === undefined) {
    if (typeof opts === 'function') {
      nextApp = opts;
      opts = {};
    } else {
      return mixin(function (nextApp) {
        return Auth(opts || {}, nextApp);
      });
    }
  }

  var auth = function (req) {
    return q.when(auth.execute(req), function (res) {
      if (typeof res !== 'undefined' && typeof res.status !== 'undefined' && typeof res.body !== 'undefined') {
        return res;
      }

      return nextApp(req);
    });
  };
  
  return mixin(auth);

  function mixin(target) {
    var strategies = {};

    target.use = function (strategy) {
      if (!strategy.name) {
        throw new Error('Strategy does not have required property name');
      }

      strategies[strategy.name] = Strategy.extend(strategy);
    };

    target.discard = function (name) {
      delete strategies[name];
    };

    target.clear = function () {
      strategies = {};
    };

    target.execute = function (req /*, strategy names... */) {
      var args = Array.prototype.slice.call(arguments)
        , strategiesToExecute;

      args.shift();

      if (args.length === 0) {
        strategiesToExecute = Object.keys(strategies).map(function (key) {
          return strategies[key];
        });
      } else {
        strategiesToExecute = [];

        args.forEach(function (strategyName) {
          strategiesToExecute.push(strategies[strategyName]);
        });
      }

      strategiesToExecute = strategiesToExecute
        .map(function (strategy) {
          return strategy(req);
        })
        .filter(function (strategy) {
          return strategy.valid();
        });

      if (strategiesToExecute.length > 0) {
        return strategiesToExecute[0].execute();
      }

      return undefined;
    };

    if (opts && opts.facebook) {
      strategies['facebook'] = function (req) {
        return new FacebookStrategy(opts.facebook, req);
      }
    }

    return target;
  }
};

Auth.OAuth2Strategy = OAuth2Strategy;

Auth.Strategy = Strategy;

module.exports = Auth;
