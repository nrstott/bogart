var middleware = require('../middleware')
  , _ = require('underscore');

function parseTwitterProfile(body) {
  if (body) {
    var o = JSON.parse(body),
      profile = {
        provider: 'twitter',
        id: o.id,
        userName: o.screen_name,
        email: o.screen_name,
        imageLocation: o.profile_image_url
      };
    if (o.name) {
      var nameSplit = o.name.split(' ');
      profile.givenName = nameSplit[0];
      profile.surName = nameSplit[1];
    }
    if (o.location) {
      var locationSplit = o.location.split(',');
      profile.city = locationSplit[0];
      profile.state = locationSplit[1].trim();
    }
    return profile;
  }
}

module.exports = twitterMiddleware;

function twitterMiddleware(config, nextApp) {
  if (nextApp === undefined) {
    return function (nextApp) {
      return twitterMiddleware(config, nextApp);
    };
  }

  var twitter_strategy = {
    authorizationURL: 'https://api.twitter.com/oauth/authorize',
    requestTokenURL: 'https://api.twitter.com/oauth/request_token',
    accessTokenURL: 'https://api.twitter.com/oauth/access_token',
    resourceURL: 'https://api.twitter.com/1.1/users/show.json',
    parse: twitterMiddleware.parseTwitterProfile,
    resourceURLParams: [ 'user_id' ]
  };

  var oauthOptions = _.extend(twitter_strategy, config);

  return middleware.oauth(oauthOptions, nextApp);
};

twitterMiddleware.parseTwitterProfile = parseTwitterProfile;
