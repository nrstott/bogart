var q = require('../q')
  , oauth = require('oauth')
  , bogart = require('../bogart')
  , _ = require('underscore')
  , url = require('url');

module.exports = function oauthMiddleware(config, nextApp) {
  if (nextApp === undefined) {
    return function (nextApp) {
      return oauthMiddleware(config, nextApp);
    };
  }

  var options = {
    loginRoute: '/auth/login',
    logoutRoute: '/auth/logout',
    callbackRoute: '/auth/callback'
  };
  options = _.extend(options, config);

  if (!options.host) {
    throw new Error('host is a required option')
  }

  if (!options.host.match(/^http/)) {
    throw new Error('host must include the protocal.');
  }

  options.host = options.host.replace(/\/$/, ''); //remove trailing slash
     
  var OAuth = new oauth.OAuth(options.requestTokenURL, options.accessTokenURL, options.consumerKey, options.consumerSecret, '1.0A', null, 'HMAC-SHA1');

  var authorized = function(req) {
    if (!req.session('profile')) {
      return bogart.redirect(options.loginRoute + '?returnUrl=' + req.pathInfo );
    }
    req.auth = req.auth || {};
    req.auth.profile = req.session('profile');
    req.auth.access_token = req.session('access_token');
    return nextApp(req);
  };

  var router = bogart.router(authorized);

  router.get(options.loginRoute, function (req) {
    var deferred = q.defer();
    var callbackRoute = options.host + options.callbackRoute;
    if (req.params.returnUrl) {
      callbackRoute += '?returnUrl=' + encodeURIComponent(req.params.returnUrl);
    }
    var params = {
      oauth_callback: callbackRoute
    };
    OAuth.getOAuthRequestToken(params, function (error, token, tokenSecret, params) {
      if (error) {
        deferred.reject(error);
      }
      req.session('oauth_token_secret', tokenSecret);
      var parsed = url.parse(options.authorizationURL, true);
      parsed.query.oauth_token = token;
      var location = url.format(parsed);
      deferred.resolve(bogart.redirect(location));
    });
    return deferred.promise;
  });

  router.get(options.logoutRoute, function (req) {
    req.session('profile', undefined);

    return bogart.redirect('/');
  });

  router.get(options.callbackRoute, function (req) {
    var deferred = q.defer();
    var oAuthToken = req.params.oauth_token,
      oAuthVerifier = req.params.oauth_verifier,
      oAuthTokenSecret = req.session('oauth_token_secret');
    OAuth.getOAuthAccessToken(oAuthToken, oAuthTokenSecret, oAuthVerifier, function (error, accessToken, tokenSecret, params) {
      if (error) {
        deferred.reject(error);
      }
      var parsed = url.parse(options.resourceURL, true);
      options.resourceURLParams.forEach(function (resourceUrlParam) {
        if (params[resourceUrlParam]) {
          parsed.query[resourceUrlParam] = params[resourceUrlParam];
        }
      });
      var location = url.format(parsed);
      OAuth.getProtectedResource(location, 'get', accessToken, tokenSecret, function (error, body, res) {
        if (error) {
          deferred.reject(error);
        }
        var profile = q(options.parse(body, req)).then(function (profile) {
          req.session('profile', profile);
          req.session('access_token', accessToken);
          return bogart.redirect(req.params.returnUrl || '/');
        });
        deferred.resolve(profile);
      });
    });
    return deferred.promise;
  });

  return router(nextApp);
};
