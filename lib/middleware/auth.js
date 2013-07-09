var _ = require('underscore')
  , q = require('q')
  , url = require('url')
  , bogart = require('../bogart');

var defaultConfig = {
  loginUrl: '/auth/login',
  logoutUrl: '/auth/logout'
};

function Strategy(req) {
  this.name = 'strategy';
  this.req = req;
  this.headers = req.headers;

  this._userDeferred = q.defer();
  this.user = this._userDeferred.promise;
}

/**
 * Determines if a request should be handled by
 * this strategy.
 *
 * @req {Object} JSGI Request
 * @returns {Boolean}
 */
Strategy.prototype.valid = function (req) {
  throw new Error('The valid method must be overridden by a strategy implementation');
};

Strategy.prototype.authenticate = function () {
  throw new Error('The authenticate method must be overridden by a strategy implementation');
};

Strategy.prototype.execute = function () {
  var self = this;

  return q.when(this.authenticate(), function (user) {
    self._userDeferred.resolve(user);
    return true;
  }, function (err) {
    self._userDeferred.reject(err);
    return false;
  });
};

Strategy.extend = function (subclass) {
  var ctor = function (req) {
    if (!this.authenticate) {
      return new ctor(req);
    }

    Strategy.call(this, req);

    if (typeof subclass.init === 'function') {
      subclass.init(req);
    }
  };

  ctor.prototype = _.extend({}, Strategy.prototype, subclass);

  return ctor;
};

function OAuth2Strategy(opts) {
  var requiredOptions = [ 'authorizationUrl', 'tokenUrl', 'clientId', 'clientSecret' ];

  Strategy.call(this);

  opts = opts || {};

  requiredOptions.forEach(function (optionName) {
    if (!opts[optionName]) {
      throw new Error(requiredErrorMessage(optionName));
    }
  });

  this.callbackUrl = opts.callbackUrl;
  this.scope = opts.scope;
  this.scopeSeperator = opts.scopeSeperator || ' ';

  Object.defineProperty(this, 'oauth2', {
    enumerable: false,
    writable: false,
    value: new OAuth2(opts.clientId, opts.clientSecret, '', opts.authorizationUrl, opts.tokenUrl, opts.headers)
  });

  function requiredErrorMessage(optionName) {
    return 'OAuth2Strategy requires ' + optionName + ' option';
  }
}

OAuth2Strategy.prototype = _.extend({}, Strategy.prototype, {
  authenticate: function (req, opts) {
    opts = opts || {};

    var callbackUrl = opts.callbackUrl || this.callbackUrl;

    if (req.params && req.params.error) {
      return q.reject(req.params.error);
    }

    if (req.params && req.params.code) {
      return this.getOauthAccessToken(req.params.code, callbackUrl);
    }

    var authParams = this.authorizationParams(opts);
    authParams.response_type = 'code';
    authParams.redirect_uri = callbackUrl;

    var scope = opts.scope || this.scope;
    if (scope) {
      if (Array.isArray(scope)) {
        scope = scope.join(this.scopeSeperator);
      }

      authParams.scope = scope;
    }

    var location = this.oauth2.getAuthorizeUrl(authParams);
    return bogart.redirect(location);
  },

  getOauthAccessToken: function (code, callbackUrl) {
    var deferred = q.defer();

    this.oauth2.getOauthAccessToken(code, {
      grant_type: 'authorization_code',
      redirect_uri: callbackUrl
    }, handleAccessTokenResponse(this.userProfile));

    return deferred.promise;
  },

  /**
   * Get user profile information from OAuth 2.0 provider.
   *
   * This method should be overridden by providers in order to
   * retrieve profile information available from the OAuth 2.0 provider
   * to assist in completing registration forms.
   *
   * @param {String} accessToken
   * @returns {Promise}
   * @api protected
   */
  userProfile: function (accessToken) {
    return q.resolve(null);
  }
});

/**
 * Returns a function that handles the access token response received
 * from the OAuth2 provider.
 *
 * @param {Function} userProfile  Loads user profile given an accessToken
 * @returns {Function}
 */
function handleAccessTokenResponse(userProfile, verify) {
  return function (err, accessToken, refreshToken, params) {
    if (err) {
      return q.reject(err);
    }

    return userProfile(accessToken).then(function (profile) {
      return verify(accessToken, refreshToken, params, profile);
    });
  };
}

function FacebookStrategy() {
  this.name = 'facebook';
}

function Auth(opts, nextApp) {
  if (nextApp === undefined) {
    if (typeof opts === 'function') {
      nextApp = opts;
      opts = {};
    } else {
      return mixin(function (nextApp) {
        return Auth(opts, nextApp);
      });
    }
  }

  var auth = function (req) {
    req.env.auth = auth;

    return q.when(auth.execute(req), function () {
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

      var strategyPromises = strategiesToExecute
        .map(function (strategy) {
          return strategy(req);
        })
        .filter(function (strategy) {
          return strategy.valid();
        })
        .map(function (strategy) {
          return strategy.execute(req);
        });

      return q.all(strategyPromises);
    };

    return target;
  }
};

Auth.authenticate = function (strategyName) {
  return function (req) {
    return req.env.auth.execute(req, strategyName);
  };
};

Auth.Strategy = Strategy;

module.exports = Auth;
