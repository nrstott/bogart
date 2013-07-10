var _ = require('underscore')
  , q = require('q')
  , url = require('url')
  , bogart = require('../bogart')
  , OAuth2 = require('oauth').OAuth2;

var defaultConfig = {
  loginUrl: '/auth/login',
  logoutUrl: '/auth/logout'
};

function Strategy(req) {
  this.name = 'strategy';
  this.req = req;
  this.headers = req.headers;
  this.session = req.session;
  this.params = req.params;

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

Strategy.prototype.authenticate = function (req) {
  throw new Error('The authenticate method must be overridden by a strategy implementation');
};

Strategy.prototype.serializeUser = function (user) {
  return JSON.stringify(user);
};

Strategy.prototype.deserializeUser = function (user) {
  return JSON.parse(user);
};

Strategy.prototype.execute = function () {
  var self = this;

  return q.when(this.authenticate(this.req), function (user) {
    self._userDeferred.resolve(user);

    return q.when(self.serializeUser(user), function (serializedUser) {
      self.session('user', serializedUser);

      return true;
    });
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

function OAuth2Strategy(opts, req) {
  var requiredOptions = [ 'authorizationUrl', 'tokenUrl', 'id', 'secret', 'resourceUrl' ];

  opts = opts || {};

  if (opts.parseUserProfile) {
    this.parseUserProfile = opts.parseUserProfile;
  }

  this.OAuth2Client = opts.OAuth2Client || OAuth2;

  requiredOptions.forEach(function (optionName) {
    if (!opts[optionName]) {
      throw new Error(requiredErrorMessage(optionName));
    }

    this[optionName] = opts[optionName];
  }, this);

  Strategy.call(this, req);

  this.loginUrl = opts.loginUrl || '/oauth2/login';

  this.scope = opts.scope;
  this.scopeSeperator = opts.scopeSeperator || ' ';

  Object.defineProperty(this, 'callbackUrl', {
    get: function () {
      var urlOpts = {
        protocol: req.scheme,
        hostname: req.host,
        pathname: this.loginUrl
      };

      if (this.params.returnUrl) {
        urlOpts.query = { returnUrl: this.params.returnUrl };
      }

      if (req.scheme === 'http' && req.port !== 80) {
        urlOpts.port = req.port;
      }

      if (req.scheme === 'https' && req.port !== 443) {
        urlOpts.port = req.port;
      }

      var callbackUrl = url.format(urlOpts);

      return callbackUrl;
    }
  })

  Object.defineProperty(this, 'oauth2', {
    enumerable: false,
    writable: false,
    value: new this.OAuth2Client(opts.clientId, opts.clientSecret, '', opts.authorizationUrl, opts.tokenUrl, opts.headers)
  });

  this.getUserProfile = this.getUserProfile.bind(this);
  this.verifyUser = this.verifyUser.bind(this);

  function requiredErrorMessage(optionName) {
    return 'OAuth2Strategy requires ' + optionName + ' option';
  }
}

OAuth2Strategy.prototype = _.extend({}, Strategy.prototype, {
  redirectToOAuthLogin: function () {
    if (this.params.returnUrl) {

    }
  },

  authorizationParams: function () {
    return {
      response_type: 'code',
      redirect_uri: this.callbackUrl
    }
  },

  authenticate: function () {
    if (this.params && this.params.error) {
      return q.reject(this.params.error);
    }

    if (this.params && this.params.code) {
      return this.getTokens(this.params.code, this.callbackUrl)
        .then(this.getUserProfile)
        .then(this.verifyUser);
    }

    var authParams = this.authorizationParams();

    var scope = this.scope;
    if (scope) {
      if (Array.isArray(scope)) {
        scope = scope.join(this.scopeSeperator);
      }

      authParams.scope = scope;
    }

    var location = this.oauth2.getAuthorizeUrl(authParams);
    return bogart.redirect(location);
  },

  /**
   * Gets the access token and refresh token.
   *
   * @api protected
   * @return {Object} An object with keys accessToken and refreshToken.
   */
  getTokens: function (code, callbackUrl) {
    var deferred = q.defer();

    this.OAuth2Client.getOauthAccessToken(code, {
      grant_type: 'authorization_code',
      redirect_uri: callbackUrl
    }, function (err, accessToken, refreshToken) {
      if (err) {
        deferred.reject(err);
        return;
      }

      deferred.resolve({
        accessToken: accessToken,
        refreshToken: refreshToken
      });
    });

    return deferred.promise;
  },

  getUserProfile: function (tokens) {
    var self = this
      , deferred = q.defer();

    this.OAuth2Client.getProtectedResource(this.resourceUrl, tokens.accessToken, function (err, body, res) {
      if (err) {
        deferred.reject(err);
        return;
      }

      try {
        deferred.resolve(self.parseUserProfile(body));
      } catch (err) {
        deferred.reject(err);
        return;
      }
    });

    return deferred.promise;
  },

  parseUserProfile: function (body, res) {
    throw new Error('The parseUserProfile method must be overridden by a strategy implementation');
  },

  verifyUser: function (user) {
    throw new Error('The verifyUser method must be overridden by a strategy implementation');
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

Auth.OAuth2Strategy = OAuth2Strategy;

Auth.Strategy = Strategy;

module.exports = Auth;
