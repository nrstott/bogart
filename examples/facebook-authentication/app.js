const PORT = 1337;

var path = require('path');
var bogart = require('../../lib/bogart');

var config = require('./config.json');

var facebookConfig = {
  clientId: config.appId,
  clientSecret: config.secret,
  host: 'http://localhost:'+PORT
};

var router = bogart.router();
router.get('/profile', function(req) {
  return bogart.html(JSON.stringify(req.session('profile')));
});

var frontRouter = bogart.router();
frontRouter.get('/', function(req) {
  return bogart.html('<a href="/profile">Profile</a> | <a href="/login">Login</a>');
});

frontRouter.get('/login', function(req) {
  return bogart.html('<a href="/auth/login?returnUrl=/profile"><img src="login-with-facebook.png" width="154" height="22"></a>');
});

var app = bogart.app();
app.use(bogart.middleware.session({ secret: 'ABC123' }));
app.use(bogart.middleware.directory(path.join(__dirname, 'public')));
app.use(frontRouter);
app.use(bogart.middleware.facebook(facebookConfig));
app.use(router);

app.start(PORT);
