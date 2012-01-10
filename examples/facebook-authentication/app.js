var bogart = require('../../lib/bogart');

var FACEBOOK_APP_ID = "_APP_ID_"
var FACEBOOK_APP_SECRET = "_SECRET_";

// Example oauth2 Strategy
// would be called like: var fbauth = new bogart.middleware.facebook(facebook_strategy, router);
var facebook_strategy = {
  authorizationURL: 'https://www.facebook.com/dialog/oauth',
  tokenURL: 'https://graph.facebook.com/oauth/access_token',
  resourceURL: 'https://graph.facebook.com/me',
  clientId: FACEBOOK_APP_ID,
  clientSecret: FACEBOOK_APP_SECRET,
  redirectURL: '/profile',
  host: 'localhost',
  parse: function(body) {
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
};

var facebook_simple = {
	clientId: FACEBOOK_APP_ID,
  clientSecret: FACEBOOK_APP_SECRET,
  host: 'http://localhost'
}

var router = bogart.router();
router.get('/profile', function(req) {
  return bogart.html(JSON.stringify(req.session('profile')));
});

var frontRouter = bogart.router();
frontRouter.get('/', function(req) {
  return bogart.html('<a href="/profile">Profile</a> | <a href="/login">Login</a>');
});

frontRouter.get('/login', function(req) {
  return bogart.html('<a href="/auth/login"><img src="login-with-facebook.png" width="154" height="22"></a>');
});

var app = bogart.app();
app.use(bogart.middleware.directory(require("path").join(__dirname, "public")));
app.use(bogart.middleware.flash());
app.use(bogart.middleware.session());
app.use(frontRouter);
app.use(bogart.middleware.facebook(facebook_simple));
app.use(router);

app.start();
