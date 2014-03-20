var middleware = require('../middleware')
  , _ = require('underscore');

function parseGoogleProfile(body) {
  if (body) {
    o = JSON.parse(body);
    var profile = {
      provider: 'google'
    };
    profile.id = o.id;
    profile.displayName = o.displayName;
    profile.name = o.name;
    profile.gender = o.gender;
    profile.profileUrl = o.url;
    if (o.emails) {
      profile.emails = o.emails;
    }
    return profile;
  }
}

module.exports = googleMiddleware;

function googleMiddleware(config, nextApp) {
  if (nextApp === undefined) {
    return function (nextApp) {
      return googleMiddleware(config, nextApp);
    };
  }

  var googleStrategy = {
    authorizationURL: 'https://accounts.google.com/o/oauth2/auth',
    tokenURL: 'https://accounts.google.com/o/oauth2/token',
    resourceURL: 'https://www.googleapis.com/plus/v1/people/me',
    authorizationParams: {
      scope: 'https://www.googleapis.com/auth/plus.profile.emails.read'
    },
    parse: googleMiddleware.parseGoogleProfile
  };

  var oauth2Options = _.extend(googleStrategy, config);

  return middleware.oauth2(oauth2Options, nextApp);
};

googleMiddleware.parseGoogleProfile = parseGoogleProfile;
