var
  util         = require('./util'),
  EventEmitter = require('events').EventEmitter,
  Q            = require('./q'),
  when         = Q.when,
  inherits     = require('util').inherits,
  slice        = Array.prototype.slice,
  _            = require('underscore'),
  Injector     = require('bogart-injector'),
  Request      = require('./request');

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

exports.Router = Router;
function Router() {
  if (!this.respond) {
    return new Router();
  }

  var settings = {}

  var app = function (injector) {
    if (!injector.has('req')) {
      throw new Error('Bogart Router requires an injector ' +
        'with a request dependency registered under key `req`');
    }

    injector.value('req', new Request(injector.resolve('req')));

    return app.respond(injector.invoke.bind(injector));
  };

  app.routes = {};
  app.beforeCallbacks = [];
  app.afterCallbacks = [];

  app.setting = function(name, val) {
    if (val === undefined) {
      return settings[name];
    }

    settings[name] = val;
    return this;
  };

  EventEmitter.call(app);

  _.extend(app, this.__proto__);

  return app;
}

inherits(Router, EventEmitter);

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
    , args = slice.call(arguments);

  method = args.shift();
  path = args.shift();
  apps = args;

  if (path.constructor === String) {
    paramNames = path.match(PATH_PARAMETERS) || [];
    paramNames = paramNames.map(function(x) { return x.substring(1); });

    path = new RegExp("^"+path.replace(/\./, '\\.').replace(/\*/g, '(.+)').replace(PATH_PARAMETERS, PATH_PARAMETER_REPLACEMENT)+'$');
  }

  route = makeRoute({ path: path, paramNames: paramNames, apps: apps, originalPath: originalPath });

  // this.emit not supported for some reason
  // this.emit(exports.bogartEvent.BEFORE_ADD_ROUTE, this, route);

  this.routes[method] = this.routes[method] || [];
  this.routes[method].push(route);

  // this.emit(exports.bogartEvent.AFTER_ADD_ROUTE, this, route);

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

Router.prototype.respond = function (invoke) {
  var self = this
    , noRouteMatchesReason = 'No route matches request'

  var route = invoke(function (req) {
    var route = self.handler(req.method, req.pathInfo);
    if (route) {
      route.bindRouteParametersToRequest(req);
    }

    return route;
  });

  if (util.no(route)) {
    return next(invoke);
  }

  var allBefores = Q.all(self.beforeCallbacks.map(function(cb) { return invoke(cb) }));

  return allBefores
    .then(function () {
      var stackApps = stack(invoke, route.apps);

      return stackApps();
    })
    .then(function(resp) {
      var allAfters = Q.all(self.afterCallbacks.map(function(cb) { return invoke(cb); }));

      return allAfters.then(thenResolve(resp));
    })
    .then(function(resp) {
      if (util.no(resp)) {
        return next(invoke);
      }

      return resp;
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

Router.prototype.isRouter = true;

/**
 * Takes a variadic number of callbacks and chains them together.
 *
 * @param {Function} invoke  function used to execute the callbacks
 * @param {Array} callbacks  array of callbacks
 * @returns {Function} A function that takes a request and executes a sequence of callbacks.
 */
function stack(invoke, callbacks) {
  if (callbacks.length === 0) {
    return function () {
    }
  }

  callbacks = callbacks.concat();

  function next() {
    var cb = callbacks.shift();
    var locals = callbacks.length > 0 ? { next: next } : {};

    return invoke(cb, null, locals);
  }

  return function () {
    return next();
  };
}

function getParameterNames(fn) {
  var source = fn.toString();

  var signature = source.slice(source.indexOf('(') + 1, source.indexOf(')'));

  return signature.match(/([^\s,]+)/g);
}

exports.stack = stack;

/**
 * Returns a function that returns @param val.
 *
 * @param val The value to return
 * @returns {Function} A function that returns `val`.
 */
function thenResolve(val) {
  return function() {
    return val;
  }
}

function next(invoke) {
  return invoke(function (next) {
    if (next !== null) {
      return next();
    }
  });
}

function makeRoute(proto) {
  return Object.create(proto, {
    bindRouteParametersToRequest: {
      value: function(req) {
        var route = this
          , routeParamValues = route.path.exec(req.pathInfo);

        if (routeParamValues) {
          routeParamValues.shift(); // Remove the initial match

          routeParamValues
            .map(decodeURIComponent)
            .forEach(function(val, indx) {
              if (route.paramNames && route.paramNames.length > indx) {
                req.routeParams[route.paramNames[indx]] = val;
              } else if (val !== undefined) {
                req.routeParams.splat = req.routeParams.splat || [];
                req.routeParams.splat.push(val);
              }
            });
        }
      }
    }
  });
}
