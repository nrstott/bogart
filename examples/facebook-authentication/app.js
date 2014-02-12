var bogart = require('../../lib/bogart');
var path = require('path');

// Replace these values with the values from your facebook app.
var FACEBOOK_APP_ID = "YOUR_APP_ID";
var FACEBOOK_APP_SECRET = "YOUR_APP_SECRET";

var PORT = 1337;

var facebookConfig = {
  clientId: FACEBOOK_APP_ID,
  clientSecret: FACEBOOK_APP_SECRET,
  host: 'http://localhost:'+PORT
};

var router = bogart.router();
router.get('/profile', function(req) {
  return bogart.html(JSON.stringify(req.session('profile')));
});

var facebookAuth = new bogart.middleware.facebook(facebookConfig);

var frontRouter = bogart.router();
frontRouter.get('/', function(req) {
  return bogart.html('<a href="/profile">Profile</a> | <a href="/login">Login</a>');
});

frontRouter.get('/login', function(req) {
  return bogart.html('<a href="/auth/login?returnUrl=/profile"><img src="login-with-facebook.png" width="154" height="22"></a>');
});

var app = bogart.app();
app.use(bogart.middleware.session());
app.use(bogart.middleware.flash());
app.use(bogart.middleware.directory(path.join(__dirname, 'public')));
app.use(frontRouter);
app.use(facebookAuth);
app.use(router);

app.start(PORT);
