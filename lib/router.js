var
  util         = require('./util'),
  EventEmitter = require('events').EventEmitter,
  Q            = require('promised-io/lib/promise'),
  when         = Q.when,
  inherits     = require('util').inherits;  

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
Router.prototype.route = function(method, path, handler) {
  var paramNames, route, originalPath = path;

  if (path.constructor === String) {
    paramNames = path.match(PATH_PARAMETERS) || [];
    paramNames = paramNames.map(function(x) { return x.substring(1); });

    path = new RegExp("^"+path.replace(/\./, '\\.').replace(PATH_PARAMETERS, PATH_PARAMETER_REPLACEMENT)+'$');
  }

  route = { path: path, paramNames: paramNames, handler: handler, originalPath: originalPath };

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
      if (path.match(route.path)) {
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

    var args = [req].concat(routeParamValues || []);

    /* Invoke all 'before' functions and save any promises. */
    var promiseArray= [];
    self.beforeCallbacks.forEach(function(cb) {
        promiseArray.push(cb.apply(self, args));
    });
    /* Wait until any promises have completed. */
    return when(Q.all(promiseArray),
        /* Success. */
        function(){
            /* Handle the request. */
            var handlerResp = route.handler.apply(self, args);
            if (util.no(handlerResp)) {
              throw new Error("Handler returned empty response:" + JSON.stringify(route));
            }

            /* Invoke all 'after' functions and save any promises. */
            var promiseArray= [];
            self.afterCallbacks.forEach(function(cb) {
                promiseArray.push(cb.apply(self, args));
            });
            /* Wait until any promises have completed. */
            return when(Q.all(promiseArray),
                /* Success. */
                function(){
                    return when(handlerResp, function(resp) {
                      if (resp.headers && resp.headers['X-Powered-By'] === undefined) {
                        resp.headers['X-Powered-By'] = 'Bogart';
                      }

                      return resp;
                    });
                }
            );
        }
    );

  });
};

Router.prototype.show = Router.prototype.get = function(path, handler) {
  return this.route(restMethod.SHOW, path, handler);
};

Router.prototype.create = Router.prototype.post = function(path, handler) {
  return this.route(restMethod.CREATE, path, handler);
};

Router.prototype.update = Router.prototype.put = function(path, handler) {
  return this.route(restMethod.UPDATE, path, handler);
};

Router.prototype.destroy = Router.prototype.del = function(path, handler) {
  return this.route(restMethod.DESTROY, path, handler);
};
