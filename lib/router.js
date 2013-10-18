var
  util         = require('./util'),
  EventEmitter = require('events').EventEmitter,
  Q            = require('./q'),
  when         = Q.when,
  inherits     = require('util').inherits,
  slice        = Array.prototype.slice,
  _            = require('underscore');

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

function defaultNotFoundApp(req) {
  var body = 'Not Found';
  if (req.pathInfo) {
    body += ': ' + req.pathInfo;
  }
  
  return {
    status: 404,
    body: [body],
    headers: { 'Content-Length': Buffer.byteLength(body, 'utf-8'), 'Content-Type': 'text/html' }
  };
}

exports.Router = Router;
function Router() {
  if (!this.respond) {
    return new Router();
  }

  var settings = {}

  var app = function (notFoundApp) {
    if (notFoundApp) {
      if (typeof notFoundApp !== 'function') {
        throw new Error('Invalid argument: router expects a function.')
      }

      app.nextApp = notFoundApp;
    } else {
      app.nextApp = app.nextApp || defaultNotFoundApp;
    }

    return function (req) {
      return when(req, function(req) {
        try {
          return app.respond(require('./request')(req));
        } catch (err) {
          return Q.reject(err);
        }
      });
    };
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

Router.prototype.respond = function(req) {
  var self = this
    , noRouteMatchesReason = 'No route matches request'
    , route = self.handler(req.method, req.pathInfo);

  if (util.no(route)) {
    return this.nextApp(req);
  }

  route.bindRouteParametersToRequest(req);

  var allBefores = Q.all(self.beforeCallbacks.map(function(cb) { return cb(req) }));

  return when(allBefores)
    .then(function() {
      // Executes each of the route handlers provided to the route in sequential order.
      // Waits for one to finish before starting the next so that chaining is possible.
      var routeHandlerSequence = stack.apply(stack, route.apps);    

      return routeHandlerSequence(req)
    })
    .then(function(resp) {
      var allAfters = Q.all(self.afterCallbacks.map(function(cb) { return cb(req); }));

      return when(allAfters, thenResolve(resp));
    })
    .then(function(resp) {
      if (util.no(resp)) {
        return self.nextApp(req);
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

Router.prototype.notFound = function (jsgiApp) {
  this.nextApp = jsgiApp;
};

Router.prototype.isRouter = true;

Router.prototype.toString = function() {
  return '[object Router]';
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
  var args = slice.call(arguments);
  
  function next(req) {
    var jsgiApp = args.shift()
      , parameterNames = getParameterNames(jsgiApp)
      , parameterCount = parameterNames === null ? 0 : parameterNames.length;

    if (parameterCount == 1 && (parameterNames[0] === 'next' || parameterNames[0] === 'nextApp')) {
      return jsgiApp(next)(req);
    } else {
      return jsgiApp(req, next);
    }
  }

  return function(req) {
    return next(req);
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