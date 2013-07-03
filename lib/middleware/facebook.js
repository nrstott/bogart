var middleware = require('../middleware')
  , _ = require('underscore');

module.exports = function facebook(config, nextApp) {
  if (nextApp === undefined) {
    return function (nextApp) {
      return facebook(config, nextApp);
    };
  }

  var facebook_strategy = {
    authorizationURL: 'https://www.facebook.com/dialog/oauth',
    tokenURL: 'https://graph.facebook.com/oauth/access_token',
    resourceURL: 'https://graph.facebook.com/me',
    parse: function(body) {
      if (body){
        o = JSON.parse(body);
        var profile = {
          provider: 'facebook'
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

  var oauth2Options = _.extend(facebook_strategy, config);

  return middleware.oauth2(oauth2Options, nextApp);
};
