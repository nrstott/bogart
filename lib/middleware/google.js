var middleware = require('../middleware')
  , _ = require('underscore');

module.exports = function googleAuth(config, nextApp) {
  if (nextApp === undefined) {
    return function (nextApp) {
      return googleAuth(config, nextApp);
    };
  }

  var googleStrategy = {
    authorizationURL: 'https://accounts.google.com/o/oauth2/auth',
    tokenURL: 'https://accounts.google.com/o/oauth2/token',
    resourceURL: 'https://www.googleapis.com/oauth2/v1/userinfo',
    authorizationParams: {
      scope: 'https://www.googleapis.com/auth/plus.login'
    },
    parse: function(body) {
      if (body){
        o = JSON.parse(body);
        var profile = {
          provider: 'google'
        };
        profile.id = o.id;
        profile.username = o.username;
        profile.displayName = o.name;
        profile.name = {
          familyName: o.last_name,
          givenName: o.first_name,
          middleName: o.middle_name
        };
        profile.gender = o.gender;
        profile.profileUrl = o.link;
        profile.emails = [{
          value: o.email
        }];
        return profile;
      }
       return undefined;
    }
  };

  var oauth2Options = _.extend(googleStrategy, config);

  return middleware.oauth2(oauth2Options, nextApp);
};
