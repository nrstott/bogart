var middleware = require('../middleware')
  , _ = require('underscore');

function parseFacebookProfile(body) {
  if (body){
    var o = JSON.parse(body);
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
    profile.emails = [ o.email ];
    return profile;
  }
}

function facebookMiddleware(config) {
  var facebookStrategy = {
    authorizationURL: 'https://www.facebook.com/dialog/oauth',
    tokenURL: 'https://graph.facebook.com/oauth/access_token',
    resourceURL: 'https://graph.facebook.com/me',
    parse: function(body) {
      if (body){
        var o = JSON.parse(body);
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
    }
  };

  var oauth2Options = _.extend(facebookStrategy, config);

  return middleware.oauth2(oauth2Options);
}

facebookMiddleware.parseFacebookProfile = parseFacebookProfile;

module.exports = facebookMiddleware;
