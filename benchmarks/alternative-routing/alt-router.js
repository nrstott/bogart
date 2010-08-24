var
  util      = require('../../lib/util'),
  EventEmitter = require('events').EventEmitter,
  Q            = require('promised-io/promise'),
  when         = Q.when,
  bogart       = require('../../lib/bogart');

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
  PATH_PARAMETER_REPLACEMENT = "([^\.\/\?]+)",
  PATH_PARAMETERS = /@([\w\d]+)/g;

exports.bogartEvent = {
  BEFORE_ADD_ROUTE: "beforeAddRoute",
  AFTER_ADD_ROUTE: "afterAddRoute"
};

exports.Router = Router;

exports.init = function(config, notFoundApp) {
  var
    defaultNotFoundApp = function(req) {
      var body = 'Not Found';
      if (req.pathInfo) {
        body += ': ' + req.pathInfo;
      }

      return {
        status: 404,
        body: [body],
        headers: { 'Content-Length': body.length, 'Content-Type': 'text/html' }
      };
    },
    router = new Router();

  function bindToRouter(method) {
    return function() { method.apply(router, arguments); };
  }
  config.call(router, bindToRouter(router.show), bindToRouter(router.create), bindToRouter(router.update), bindToRouter(router.destroy));

  return function(req) {
    var resp;
    try {
      resp = router.respond(bogart.request(this, req));
      if(util.no(resp) && req.pathInfo !== '/routes') {
        if(notFoundApp) { return notFoundApp(req); }
        else return defaultNotFoundApp(req);
      }
      if ((util.no(resp) || resp.status === 404)&& req.pathInfo === '/routes') {
        var str = 'GET<br />';

        for(var rte in router.routes['get']) {
          str += '<p>';
          str += 'path: ' + router.routes['get'][rte].path + '<br />' + 'paramNames: ' + router.routes['get'][rte].paramNames;
          str += '</p>';
        }

        return { status: 200, headers: { 'Content-Length': str.length, "Content-Type": "text/html" }, body: [ str ] };
      }

      return resp;
    } catch (err) {
      var str = 'Error<br />'+err.toString()+'<br />Stack Trace:<br />'+JSON.stringify(err.stack);
      return { status: 500, headers: { 'Content-Type': 'text/html', "Content-Length": str.length }, body: [ str ] };
    }
  };
};

function Router() {
  var
    emitter = new EventEmitter(),
    settings = {}, k;

  for (k in emitter) {
    this[k] = emitter[k];
  }

  this.setting = function(name, val) {
    if (val === undefined) {
      return settings[name];
    }

    settings[name] = val;
    return this;
  };
  this.routes = {};
}

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

    path = new RegExp(path.replace(/\./, '\\.').replace(PATH_PARAMETERS, PATH_PARAMETER_REPLACEMENT));
  }

  route = { path: path, paramNames: paramNames, handler: handler, originalPath: originalPath, pathName: originalPath.replace(/@[^\/\?]+/g, "@PARAM")};

  this.emit(exports.bogartEvent.BEFORE_ADD_ROUTE, this, route);

  this.routes[method] = this.routes[method] || {};
  this.routes[method][route.pathName] = route;

  this.emit(exports.bogartEvent.AFTER_ADD_ROUTE, this, route);

  return this;
};

Router.prototype.handler = function(verb, path) {
  return this.routes[verb.toLowerCase()] ? this.routes[verb.toLowerCase()][path.replace(/@[^\/\?]+/g, "@PARAM")] : null;
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
        val = val.substring(1);
        if (route.paramNames.length > indx) {
          routeParams[route.paramNames[indx]] = val;
        } else if (val !== undefined) {
          routeParams.splat = routeParams.splat || [];
          routeParams.splat.push(val);
        }
      });

//      console.log(routeParams);
    }

    Object.defineProperty(req, 'routeParams', { value: routeParams, enumerable: true, readonly: true });
    Object.defineProperty(req, 'params', { value: util.merge({}, req.routeParams, req.search, req.body), enumerable: true, readonly: true });

    var hold = [];
    for(var name in routeParams) {
      hold.push(routeParams[name]);
    }

    var handlerResp = route.handler.apply(self, [req].concat(hold || []));
    if (util.no(handlerResp)) {
      throw new Error("Handler returned empty response:" + JSON.stringify(route));
    }

    return handlerResp;
  });
};

Router.prototype.show = function(path, handler) {
  return this.route(restMethod.SHOW, path, handler);
};

Router.prototype.create = function(path, handler) {
  return this.route(restMethod.CREATE, path, handler);
};

Router.prototype.update = function(path, handler) {
  return this.route(restMethod.UPDATE, path, handler);
};

Router.prototype.destroy = function(path, handler) {
  return this.route(restMethod.DESTROY, path, handler);
};