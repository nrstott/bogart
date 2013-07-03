var q = require('../q')
  , oauth = require('oauth')
  , bogart = require('../bogart')
  , _ = require('underscore');

module.exports = function oauth2Middleware(config, nextApp) {
  if (nextApp === undefined) {
    return function (nextApp) {
      return oauth2Middleware(config, nextApp);
    };
  }

  var options = {
    loginRoute: '/auth/login',
    logoutRoute: '/auth/logout',
    callbackRoute: '/auth/callback',
    modalAuthRoute: '/auth/modalauth'
  };
  options = _.extend(options, config);

  if (!options.host) {
    throw new Error('host is a required option')
  }

  if (!options.host.match(/^http/)) {
    throw new Error('host must include the protocal.');
  }

  options.host = options.host.replace(/\/$/, ''); //remove trailing slash
     
  var OAuth2 = new oauth.OAuth2(options.clientId, options.clientSecret, '', options.authorizationURL, options.tokenURL);

  var authd = function(req) {
    if (!req.session('profile')) {
      return bogart.redirect(options.loginRoute + '?returnUrl=' + req.pathInfo );
    }
    req.auth = req.auth || {};
    req.auth.profile = req.session('profile');
    req.auth.access_token = req.session('access_token');
    return nextApp(req);
  };
  var router = bogart.router(authd);
  var callbackRoute = '' 
  router.get(options.loginRoute, function (req) {
    
    callbackRoute = options.host + options.callbackRoute;
    if (req.params.returnUrl) {
      callbackRoute += '?returnUrl=' + encodeURIComponent(req.params.returnUrl);
    }

    var url = OAuth2.getAuthorizeUrl(_.extend({
      response_type: 'code',
      redirect_uri: callbackRoute
    }, config.authorizationParams));

    return bogart.redirect(url);
  });

  router.get(options.logoutRoute, function (req) {
    req.session('profile', undefined);

    return bogart.redirect('/');
  });

  router.get(options.callbackRoute, function (req) {
    var deffered = q.defer();

    if (req.params.code) {
      var code = req.params.code;
      // NOTE: The module oauth (0.9.5), which is a dependency, automatically adds
      //     a 'type=web_server' parameter to the percent-encoded data sent in
      //     the body of the access token request.  This appears to be an
      //     artifact from an earlier draft of OAuth 2.0 (draft 22, as of the
      //     time of this writing).  This parameter is not necessary, but its
      //     presence does not appear to cause any issues.
      OAuth2.getOAuthAccessToken(code, {
        grant_type: 'authorization_code',
        redirect_uri: callbackRoute
      }, function (err, accessToken, refreshToken) {
        OAuth2.getProtectedResource(options.resourceURL, accessToken, function(err, body, res) {
          try {
            var profile = options.parse(body)
            if (err) {

            console.log(err)
              deffered.reject(err);
            }

            req.session('profile', profile);
            req.session('access_token', accessToken);

            deffered.resolve(bogart.redirect(req.params.returnUrl || '/'));
          } catch (e) {
            deffered.reject(e);
          }
        });
      });
    }

    return deffered.promise;
  });

  router.post(options.modalAuthRoute, function(req) {
    var deffered = q.defer()
      , accessToken = req.params.accessToken;

    OAuth2.getProtectedResource(options.resourceURL, accessToken, function (err, body, res) {
      try {
        var profile = options.parse(body)
        if (err) {
          deffered.reject(err);
        }

        req.session('profile', profile);
        req.session('access_token', accessToken);

        deffered.resolve(bogart.redirect(req.params.returnUrl || '/'));
      } catch (e) {        
        deffered.reject(e);
      }
    });

    return deffered.promise;
  });

  return router;
};
