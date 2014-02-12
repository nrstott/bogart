var bogart = require('../../lib/bogart');
var path = require('path');
var config = require('./config.json');

var PORT = 1337;

var googleConfig = {
  clientId: config.appId,
  clientSecret: config.secret,
  callbackRoute: config.callbackRoute,
  host: 'http://localhost:'+PORT
};

var router = bogart.router();
router.get('/profile', function(req) {
  return bogart.html(JSON.stringify(req.session('profile')));
});

var googleAuth = new bogart.middleware.google(googleConfig);

var frontRouter = bogart.router();
frontRouter.get('/', function(req) {
  return bogart.html('<a href="/profile">Profile</a> | <a href="/login">Login</a>');
});

frontRouter.get('/login', function(req) {
  req.session('returnUrl', '/profile');
  return bogart.html('<a href="/auth/login"><img src="login-with-facebook.png" width="154" height="22"></a>');
});

var app = bogart.app();
app.use(bogart.middleware.session());
app.use(bogart.middleware.flash());
app.use(bogart.middleware.directory(path.join(__dirname, 'public')));
app.use(frontRouter);
app.use(googleAuth);
app.use(router);

app.start(PORT);
