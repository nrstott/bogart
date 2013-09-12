var _ = require('underscore');

function Strategy(req) {
  this.name = 'strategy';
  this.req = req;
  this.pathInfo = req.pathInfo;
  this.headers = req.headers;
  this.session = req.session;
  this.params = req.params;
  this.sessionUserKey = 'user';

  Object.defineProperty(this, 'user', {
    get: function () {
      return req.user;
    },
    set: function (val) {
      this.session(this.sessionUserKey, this.serializeUser(val));
      req.user = val;
    }
  });
}

/**
 * Determines if a request should be handled by
 * this strategy.
 *
 * @req {Object} JSGI Request
 * @returns {Boolean}
 */
Strategy.prototype.valid = function () {
  throw new Error('The valid method must be overridden by a strategy implementation');
};

Strategy.prototype.authenticate = function () {
  throw new Error('The authenticate method must be overridden by a strategy implementation');
};

Strategy.prototype.serializeUser = function (user) {
  return JSON.stringify(user);
};

Strategy.prototype.deserializeUser = function (user) {
  return JSON.parse(user);
};

Strategy.prototype.execute = function () {
  var self = this;

  if (this.session('user')) {
    this.user = this.deserializeUser(this.session('user'));
    return bogart.redirect(this.params.returnUrl ? this.params.returnUrl : '/');
  }

  return this.authenticate();
};

Strategy.extend = function (subclass) {
  var ctor = function (req) {
    if (!this.authenticate) {
      return new ctor(req);
    }

    Strategy.call(this, req);

    if (typeof subclass.init === 'function') {
      subclass.init(req);
    }
  };

  ctor.prototype = _.extend({}, Strategy.prototype, subclass);

  return ctor;
};

module.exports = Strategy;
