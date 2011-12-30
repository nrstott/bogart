var
  util         = require('./util'),
  EventEmitter = require('events').EventEmitter,
  Q            = require('promised-io/lib/promise'),
  when         = Q.when,
  inherits     = require('util').inherits,
  slice        = Array.prototype.slice;

var
  httpMethod = {
    GET: "get",
    POST: "post",
    PUT: "put",
    DELETE: "delete"
  },
  restMethod = {
    SHOW: httpMethod.GET,
    CREATE: httpMethod.POST,
    UPDATE: httpMethod.PUT,
    DESTROY: httpMethod.DELETE
  },
  PATH_PARAMETER_REPLACEMENT = "([^\/\?]+)",
  PATH_PARAMETERS = /:([\w\d]+)/g;

exports.bogartEvent = {
  BEFORE_ADD_ROUTE: "beforeAddRoute",
  AFTER_ADD_ROUTE: "afterAddRoute"
};

var Router = exports.Router = function(config) {
  var settings = {}, k;
  
  EventEmitter.call(this);

  this.setting = function(name, val) {
    if (val === undefined) {
      return settings[name];
    }

    settings[name] = val;
    return this;
  };
  this.routes = {};
  this.beforeCallbacks = [];
  this.afterCallbacks = [];

  if(config) {
    var me = this,
        bind = function(method) { return function() {method.apply(me, arguments)}};
    config.call(me, bind(this.show), bind(this.create), bind(this.update), bind(this.destroy));
  }
};

inherits(Router, EventEmitter);

/**
 * Determines if an object is a `Router`.
 *
 * @param {Object} obj  Object to test.
 * @returns {Boolean}
 */
Router.isRouter = function(obj) {
  return obj.isRouter === true;
};

/**
 * Register a callback to happen before bogart handlers are invoked to
 * handle a request.  Multiple 'before' callbacks may be registered.
 *
 * @param {Function} cb   Callback to happen before route handler is invoked.
 */
Router.prototype.before = function(cb) {
  this.beforeCallbacks.push(cb);
};

/**
 * Register a callback to happen after bogart handlers are invoked to
 * handle a request.  Multiple 'after' callbacks may be registered.
 *
 * @param {Function} cb   Callback to happen after route handler is invoked.
 */
Router.prototype.after = function(cb) {
  this.afterCallbacks.push(cb);
};

/**
  * Register a route
  * @param {String} method Http Verb e.g. 'GET', 'POST', 'PUT', 'DELETE'
  * @param {String} path Path for the route
  * @param {Function} handler Function to execute when the route is accessed
  */
Router.prototype.route = function(method, path /*, handlers... */) {
  var paramNames, route, originalPath = path
    , args = Array.prototype.slice.call(arguments);
  
  method = args.shift();
  path = args.shift();
  apps = args;

  if (path.constructor === String) {
    paramNames = path.match(PATH_PARAMETERS) || [];
    paramNames = paramNames.map(function(x) { return x.substring(1); });

    path = new RegExp("^"+path.replace(/\./, '\\.').replace(/\*/g, '(.+)').replace(PATH_PARAMETERS, PATH_PARAMETER_REPLACEMENT)+'$');
  }

  route = { path: path, paramNames: paramNames, apps: apps, originalPath: originalPath };

  this.emit(exports.bogartEvent.BEFORE_ADD_ROUTE, this, route);

  this.routes[method] = this.routes[method] || [];
  this.routes[method].push(route);

  this.emit(exports.bogartEvent.AFTER_ADD_ROUTE, this, route);

  return this;
};

Router.prototype.handler = function(verb, path) {
  verb = verb.toLowerCase();
  var route;

  if (this.routes[verb]) {
    for (var i=0;i<this.routes[verb].length;i++) {
      route = this.routes[verb][i];
      if (path.match(route.path) || decodeURIComponent(path).match(route.path)) {
        return route;
      }
    }
  }

  if (path === '') {
    return this.handler(verb, '/');
  }

  return null;
};

Router.prototype.respond = function(reqPromise) {
  var
    self = this;

  return when(reqPromise, function(req) {
    var
      route            = self.handler(req.method, req.pathInfo),
      routeParams      = Object.create(Object.prototype),
      routeParamValues = null;

    if (util.no(route)) {
      return null;
    }

    routeParamValues = route.path.exec(req.pathInfo);
    if (routeParamValues) {
      routeParamValues.shift(); // Remove the initial match

      routeParamValues.forEach(function(val, indx) {
        val = decodeURIComponent(val);
        if (route.paramNames && route.paramNames.length > indx) {
          routeParams[route.paramNames[indx]] = val;
        } else if (val !== undefined) {
          routeParams.splat = routeParams.splat || [];
          routeParams.splat.push(val);
        }
      });
    }

    Object.defineProperty(req, 'routeParams', { value: routeParams, enumerable: true, readonly: true });

    Object.defineProperty(req, 'params', { value: util.merge({}, req.routeParams, req.search, req.body), enumerable: true, readonly: true });

    /* Invoke all 'before' functions and save any promises. */
    var promiseArray = [];
    self.beforeCallbacks.forEach(function(cb) {
        promiseArray.push(cb.call(self, req));
    });

    /* Wait until any promises have completed. */
    return when(Q.all(promiseArray), function() {
      return Q.whenCall(function() {
        var jsgiApp = stack.apply(stack, route.apps);
        return jsgiApp(req);
      }, function(resp) {
        /* Invoke all 'after' functions and save any promises. */
        var promiseArray = [];
        self.afterCallbacks.forEach(function(cb) {
            promiseArray.push(cb.call(self, req));
        });

        return when(Q.all(promiseArray), function() {
          return resp;
        });
      }, function(err) {
        // work around for issue in whenCall, it tries to call rejectCallback even if one is not provided
        throw err;
      });
    });
  });
};

Router.prototype.show = Router.prototype.get = function(path /*, jsgiApps */) {
  return this.route.apply(this, [ restMethod.SHOW ].concat(slice.call(arguments)));
};

Router.prototype.create = Router.prototype.post = function(path /*, jsgiApps */) {
  return this.route.apply(this, [ restMethod.CREATE ].concat(slice.call(arguments)));
};

Router.prototype.update = Router.prototype.put = function(path /*, jsgiApps */) {
  return this.route.apply(this, [ restMethod.UPDATE ].concat(slice.call(arguments)));
};

Router.prototype.destroy = Router.prototype.del = function(path /*, jsgiApps */) {
  return this.route.apply(this, [ restMethod.DESTROY ].concat(slice.call(arguments)));
};

/**
 * Takes a variadic number of JSGI applications and chains them together.
 *
 * A normal JSGI middleware has the signature `function(nextApp)` and is expected
 * to return a function that takes a request and does something useful then calls
 * the next application.
 *
 * Stack works with functions that have a signature of `function(req, nextApp)`.
 *
 * @returns {Function} A function that takes a request and executes a stack of JSGI applications.
 */
function stack(/* apps... */) {
  var args = Array.prototype.slice.call(arguments);
  
  function next(req) {
    var jsgiApp = args.shift();
    return jsgiApp(req, next);
  }

  return function(req) {
    return next(req);
  };
}

exports.stack = stack;
