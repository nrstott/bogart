var _ = require('underscore')
  , OAuth2Strategy = require('../auth').OAuth2Strategy;

var FACEBOOK_DEFAULTS = {
  authorizationUrl: 'https://www.facebook.com/dialog/oauth',
  tokenUrl: 'https://graph.facebook.com/oauth/access_token',
  resourceUrl: 'https://graph.facebook.com/me'
};

function FacebookStrategy(opts, req) {
  if (Object.getPrototypeOf(this) !== FacebookStrategy.prototype) {
    return new FacebookStrategy(opts, req);
  }

  opts = _.extend({}, FACEBOOK_DEFAULTS, opts);

  OAuth2Strategy.call(this, opts, req);

  if (typeof opts.verifyUser === 'function') {
    this.verifyUser = verifyUser;
  }
}

FacebookStrategy.prototype = _.extend({}, OAuth2Strategy.prototype, {
  name: 'facebook',

  parseUserProfile: function (body, res) {
    var profile = JSON.parse(body);

    _.extend(profile, {
      provider: 'facebook',
      emails: [ { value: profile.email } ],
      displayName: profile.name,
      familyName: profile.last_name,
      givenName: profile.first_name,
      middleName: profile.middle_name,
      profileUrl: profile.link
    });

    return profile;
  }
});

console.log('facebookproto', FacebookStrategy.prototype);

module.exports = FacebookStrategy;
