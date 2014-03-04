var bogart = require('../../lib/bogart');
var path = require('path');
var config = require('./config.json');

var PORT = 1337;

var facebookConfig = {
  clientId: config.appId,
  clientSecret: config.secret,
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
app.use(bogart.middleware.session({ secret: 'super-secret-do-not-share' }));
app.use(bogart.middleware.flash());
app.use(bogart.middleware.directory(path.join(__dirname, 'public')));
app.use(frontRouter);
app.use(facebookAuth);
app.use(router);

app.start(PORT);
