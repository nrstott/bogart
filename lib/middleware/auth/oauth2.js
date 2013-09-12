var _ = require('underscore')
  , url = require('url')
  , bogart = require('../../bogart')
  , q = require('../../q')
  , Strategy = require('./strategy')
  , OAuth2 = require('oauth').OAuth2;

function OAuth2Strategy(opts, req) {
  var requiredOptions = [ 'authorizationUrl', 'tokenUrl', 'id', 'secret', 'resourceUrl' ];

  opts = opts || {};

  if (typeof opts.parseUserProfile === 'function') {
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
    value: new this.OAuth2Client(opts.id, opts.secret, '', opts.authorizationUrl, opts.tokenUrl, opts.headers)
  });

  function requiredErrorMessage(optionName) {
    return 'OAuth2Strategy requires ' + optionName + ' option';
  }
}

OAuth2Strategy.extend = function (subclass) {
  var ctor = function (opts, req) {
    if (!this.authenticate) {
      return new ctor(req);
    }

    OAuth2Strategy.call(this, opts, req);

    if (typeof subclass.init === 'function') {
      subclass.init(req);
    }
  };

  ctor.prototype = _.extend({}, Strategy.prototype, subclass);

  return ctor;
};

OAuth2Strategy.prototype = _.extend({}, Strategy.prototype, {
  valid: function () {
    console.log('loginUrl', this.loginUrl, this.pathInfo, new RegExp(this.loginUrl).test(this.pathInfo));
    return new RegExp(this.loginUrl).test(this.pathInfo);
  },

  authorizationParams: function () {
    return {
      response_type: 'code',
      redirect_uri: this.callbackUrl
    }
  },

  authenticate: function () {
    var self = this;

    if (this.params && this.params.error) {
      return q.reject(this.params.error);
    }

    if (this.params && this.params.code) {
      return this.getTokens(this.params.code, this.callbackUrl)
        .then(this.getUserProfile.bind(this))
        .then(function (user) {
          try {
            self.user = self.verifyUser(user);
            return bogart.redirect(self.params.returnUrl ? self.params.returnUrl : '/');
          } catch (err) {
            return q.reject(err);
          }
        });
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

    this.oauth2.getOAuthAccessToken(code, {
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

    this.oauth2.getProtectedResource(this.resourceUrl, tokens.accessToken, function (err, body, res) {
      if (err) {
        deferred.reject(err);
        return;
      }

      try {
        var user = self.parseUserProfile(body);

        deferred.resolve(user);
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

module.exports = OAuth2Strategy;
