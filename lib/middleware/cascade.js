var q = require('../q')
  , Router = require('../router').Router;

module.exports = function(accept /*, apps */) {
  var args = Array.prototype.slice.call(arguments)
    , middlewareQueue = [];

  accept = args.shift();

  args.forEach(function(x) {
    middlewareQueue.push(x);
  });

  var cascadeApp = function(req) {
    var deferred = q.defer();

    function next() {
      var nextAction = middlewareQueue.shift();

      this.started = true;

      if (Router.isRouter(nextAction)) {
        nextAction.nextApp = next;
      }

      if (nextAction) {
        q.whenCall(function() { return nextAction(req); }, function(resp) {
          if (accept(resp)) {
            return deferred.resolve(resp);
          } else {
            return next();
          }
        }, deferred.reject);
      } else {
        deferred.reject('No suitable Response found by cascade.');
      }
    }

    next();

    return deferred.promise;
  };

  cascadeApp.use = function(middleware /*, parameters */) {
    if (this.started) {
      throw {
        message: 'Cascade has already been started. The middleware may only be configured before it is started.',
        code: 'BOGART_CASCADE_ALREADY_STARTED'
      };
    }

    var args = Array.prototype.slice.call(arguments);

    middlewareQueue.push(middleware);
  };

  return cascadeApp;
};