var 
  EventEmitter = require('events').EventEmitter,
  path         = require('path'),
  Q            = require('promised-io/promise'),
  when         = Q.when,
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
  PATH_PARAMETERS = /:([\w\d]+)/g;

exports.version = [0,0,3];

var bogartEvent = exports.bogartEvent = {
  BEFORE_ADD_ROUTE: "beforeAddRoute",
  AFTER_ADD_ROUTE: "afterAddRoute"
};

var Router = exports.Router = function() {
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

    path = new RegExp(path.replace(/\./, '\\.').replace(PATH_PARAMETERS, PATH_PARAMETER_REPLACEMENT));
  }

  route = { path: path, paramNames: paramNames, handler: handler, originalPath: originalPath };

  this.emit(bogartEvent.BEFORE_ADD_ROUTE, this, route);

  this.routes[method] = this.routes[method] || [];
  this.routes[method].push(route);

  this.emit(bogartEvent.AFTER_ADD_ROUTE, this, route);

  return this;
};

Router.prototype.show = function(path, handler) {
  return this.route(restMethod.SHOW, path, handler);
};

Router.prototype.create = function(path, handler) {
  return this.route(restMethod.CREATE, path, handler);
};

Router.prototype.update = function(path, handler) {
  return this.route(restVerb.UPDATE, path, handler);
};

Router.prototype.destroy = function(path, handler) {
  return this.route(restVerb.DESTROY, path, handler);
};

Router.prototype.respond = function(jsgiReq) {
  var
    self = this;
  
  return when(exports.request(this, jsgiReq), function(req) {
    var
      response         = exports.response(self),
      route            = self.handler(req.method, req.pathInfo),
      routeParams      = Object.create(Object.prototype),
      routeParamValues = null;
      
    if (route === null) {
     return self.notFound(req);
    }
    
    routeParamValues = route.path.exec(req.pathInfo);
    if (routeParamValues) {
      routeParamValues.shift(); // Remove the initial match
  
      routeParamValues.forEach(function(val, indx) {
        val = decodeURIComponent(val);
        if (route.paramNames.length > indx) {
          routeParams[route.paramNames[indx]] = val;
        } else if (val !== undefined) {
          routeParams.splat = routeParams.splat || [];
          routeParams.splat.push(val);
        }
      });
    }
  
    Object.defineProperty(req, 'routeParams', { value: routeParams, enumerable: true, readonly: true });
        
    Object.defineProperty(req, 'params', { value: merge({}, req.routeParams, req.search, req.body), enumerable: true, readonly: true });
    
    var handlerResp = route.handler.apply(self, [req, response].concat(routeParamValues || []));
    if (!no(handlerResp)) {
      return when(handlerResp, function(resp) {
        if (resp) {
          return resp;
        }
        
        return { status: response.status, headers: response.headers, body: response.body };
      });
    }
  
    return { status: response.status, headers: response.headers, body: response.body };
  });
};

Router.prototype.handler = function(verb, path) {
  verb = verb.toLowerCase();
  
  var 
    verbHandlers = this.routes[verb],
    route;

  if (verbHandlers) {
    
    // Match longest routes first
    verbHandlers = verbHandlers.sort(function(a,b) { return b.originalPath.length - a.originalPath.length; });
    
    for (var i=0;i<verbHandlers.length;i++) {
      route = verbHandlers[i];
      if (path.match(route.path)) {
        return route;
      }
    }
  }

  return null;
};

var Request = exports.Request = function(){};

exports.request = function(router, jsgiReq) {
  var
    search        = extractSearch(jsgiReq),
    requestedWith = jsgiReq.headers['x-requested-with'],
    isxhr         = !no(requestedWith),
    parsedBody    = when(no(jsgiReq.body) ? '' : jsgiReq.body.join(), function(body) { return require('querystring').parse(body); }),
    
    req           = Object.create(new Request(), {
      router: { value: router, enumerable: true, readonly: true },
      search: { value: search, enumerable: true, readonly: true },
      isXMLHttpRequest: { value: isxhr, enumerable: true, readonly: true }
    });

  for (var k in jsgiReq) {
    if (k === "body") { 
      continue;
    }
    Object.defineProperty(req, k, { value: jsgiReq[k], readonly: true, enumerable: true });
  }
  
  return when(parsedBody, function(body) {
    Object.defineProperty(req, 'body', { value: body, readonly: true, enumerable: true });
    
    return req;
  });
};

var Response = exports.Response = function(){
  this.status = 200;
};

Response.prototype.header = function(name, val) {
  if (val === undefined) {
    return this.headers[name];
  }
  this.headers[name] = val;
  return this;
};

Response.prototype.redirect = function(url) {
  this.headers['Location'] = url;
  this.status = 302;
  return this.end();
};

Response.prototype.send = function(txt) {
  this.status = this.status || 200;
  this.body.push(txt);
};

Response.prototype.json = function(obj) {
  this.status = this.status || 200;
  this.body.push(JSON.stringify(obj));
};

exports.response = function(router) {
  return Object.create(new Response(), {
    router: { value: router, readonly: true, enumerable: true },
    headers: { value: {}, readonly: true, enumerable: true },
    body: { value: [], readonly: true, enumerable: true }
  });
};

exports.viewEngine = function(engineName, viewsPath) {
  var engine = require("./view").viewEngine(engineName, viewsPath || exports.maindir()+"/views");
  
  return engine;
}

var Server = exports.Server = function() {};

Server.prototype.prototype = Router.prototype;

Server.prototype.addRouter = function() {
  var args = Array.prototype.slice.call(arguments);
  args.forEach(function(x) {
    this.routers.push(x);
  });
};

exports.server = function(nextApp) {
  return Object.create(Server, {
    routers: { value: [] }
  });
};

exports.app = function(config, notFoundApp) {
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
    router = Object.create(new Router(), {
      routes: { value: {}, readonly: true },
      notFound: { value: notFoundApp || defaultNotFoundApp }
    });

  function bindToRouter(method) {
    return function() { method.apply(router, arguments); };
  }
  config.call(router, bindToRouter(router.show), bindToRouter(router.create), bindToRouter(router.update), bindToRouter(router.destroy));
  
  return function(req) {
    var resp;
    try {
      resp = router.respond(req);
      if (resp.status === 404 && req.pathInfo === '/routes') {
        var str = 'GET<br />';

        router.routes['get'].forEach(function(r) {
          str += '<p>';
          str += 'path: ' + r.path + '<br />' + 'paramNames: ' + r.paramNames;
          str += '</p>';
        });

        return { status: 200, headers: { 'Content-Length': str.length }, body: [ str ] };
      }

      return resp;
    } catch (err) {
      var str = 'Error<br />'+err.toString()+'<br />Stack Trace:<br />'+JSON.stringify(err.stack);
      return { status: 500, headers: { 'Content-Type': 'text/html', "Content-Length": str.length }, body: [ str ] };
    }
  };
};

exports.text = function(txt) {
  return {
    status: 200,
    body: [txt],
    headers: { "Content-Type": "text", "Content-Length": txt.length }
  };
};

exports.html = function(html) {
  return {
    status: 200,
    body: [html],
    headers: { "Content-Type": "text/html", "Content-Length": html.length }
  };
};

exports.stream = function() {
  var 
    deferred = Q.defer(),
    buffer = [],
    streamer = function(progress) {
      deferred.progress(progress);
    };
  
  streamer.end = function() {
    deferred.resolve();
  };
    
  streamer.respond = function(opts) {
    opts = opts || {};
    opts.status = opts.status || 200;
    opts.headers = opts.headers || { "Content-Type": "text/plain" };
    
    return {
      status: opts.status,
      body: { 
        forEach: function(cb) {
          when(deferred, function success() {
          }, function error() {
            
          }, function(update) { 
            cb(update);
          });
          
          return deferred;
        }
      },
      headers: opts.headers
    };
  };
    
  return streamer;
}

exports.json = function(obj) {
  var str = JSON.stringify(obj);
  return {
    status: 200,
    body: [str],
    headers: { "Content-Type": "application/json", "Content-Length": str.length }
  }
};

exports.error = function(msg) {
  return {
    status: 500,
    body: [msg],
    headers: { "Content-Type": "text/html", "Content-Length": msg.length }
  };
};

exports.maindir = function() {
  return path.dirname(require.main.id).replace("file://","");
};

function no(value) {
  return value === undefined || value === null;
}

function extractBody(jsgiReq) {
  return when(jsgiReq.input, function(input) {
    return require('querystring').parse(input);
  });
}

function extractSearch(jsgiReq) {
  return require('querystring').parse(jsgiReq.queryString);
}

function merge(target /*, sources */) {
  var
    sources = Array.prototype.slice.call(arguments),
    k,x;
  sources.shift();
  
  sources.forEach(function(source) {
    for (var k in source) {
      target[k] = source[k];
    }
  });
  
  return target;
}
