var
  path         = require('path'),
  Q            = require('promised-io/promise'),
  util         = require('./util'),
  Router       = require('./router').Router,
  middleware   = require('./middleware'),
  when         = Q.when;

exports.version = [0,0,3];

function Request() {}

exports.request = function(router, jsgiReq) {
  var
    search        = util.extractSearch(jsgiReq),
    requestedWith = jsgiReq.headers['x-requested-with'],
    isxhr         = !util.no(requestedWith), parsedBody
    contentType   = jsgiReq.headers['content-type'],
    req           = Object.create(new Request(), {
      router: { value: router, enumerable: true, readonly: true },
      search: { value: search, enumerable: true, readonly: true },
      isXMLHttpRequest: { value: isxhr, enumerable: true, readonly: true }
    });

  for (var k in jsgiReq) {
    Object.defineProperty(req, k, { value: jsgiReq[k], readonly: true, enumerable: true });
  }
  
  return req;
};

exports.viewEngine = function(engineName, viewsPath) {
  return require("./view").viewEngine(engineName, viewsPath || exports.maindir()+"/views");
};

exports.app = function(config, notFoundApp) {
  console.log("app is deprecated, please use bogart.router");
  
  return exports.router(config, notFoundApp);
};

exports.router = function(config, notFoundApp) {
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
    router = new Router(config);
  
  return function(req) {
    var resp;
    try {
      resp = router.respond(exports.request(this, req));
      if(util.no(resp) && req.pathInfo !== "/routes") {
        if(notFoundApp) { return notFoundApp(req); }
        else return defaultNotFoundApp(req);
      }
      if ((util.no(resp) || resp.status === 404 ) && req.pathInfo === '/routes') {
        var str = 'GET<br />';

        router.routes['get'].forEach(function(r) {
          str += '<p>';
          str += 'path: ' + r.path + '<br />' + 'paramNames: ' + r.paramNames;
          str += '</p>';
        });

        return { status: 200, headers: { 'Content-Length': str.length, "Content-Type":"text/html" }, body: [ str ] };
      }

      return resp;
    } catch (err) {
      var str = 'Error<br />'+err.toString()+'<br />Stack Trace:<br />'+JSON.stringify(err.stack);
      return { status: 500, headers: { 'Content-Type': 'text/html', "Content-Length": str.length }, body: [ str ] };
    }
  };
};

exports.server = function(config) {
  var
    self = this,
    app;
  
  this.middleware = [];
  
  this.use = function() {
    this.middleware.push(Array.prototype.slice.call(arguments));
  };
  
  this.use(middleware.parseFormUrlEncoded);
  this.use(middleware.parseJson);
  
  config.call(this);
  
  this.middleware = this.middleware.reverse();
  
  this.middleware.forEach(function(middle) {
    var callable = middle.shift();

    middle.push(app);
    app = callable.apply(self, middle);
  });

  return function(req) {
    return app(req);
  };
};

exports.start = function(jsgiApp, options) {
  require("jsgi").start(jsgiApp, options);
};

exports.text = function(txt) {
  return {
    status: 200,
    body: [txt],
    headers: { "content-type": "text", "content-length": txt.length }
  };
};

exports.html = function(html, opts) {
  opts = opts || {};
  html = html || "";
  
  return {
    status: opts.status || 200,
    body: [html],
    headers: { "content-type": "text/html", "content-length": html.length }
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
};

exports.json = function(obj, opts) {
  opts = opts || {};
  
  var str = JSON.stringify(obj);
  
  return {
    status: opts.status || 200,
    body: [str],
    headers: { "content-type": "application/json", "content-length": str.length }
  }
};

exports.error = function(msg, opts) {
  opts = opts || {};
  msg = msg || "Server Error";
  
  return {
    status: opts.status || 500,
    body: [msg],
    headers: { "content-type": "text/html", "content-length": msg.length }
  };
};

exports.redirect = function(url) {
  return {
    status: 302,
    headers: { "location": url },
    body: []
  };
};

exports.maindir = function() {
  return path.dirname(require.main.id).replace("file://","");
};


