var
  path         = require('path'),
  Q            = require('promised-io/lib/promise'),
  util         = require('./util'),
  Router       = require('./router').Router,
  middleware   = require('./middleware'),
  when         = Q.when,
  merge        = require('./util').merge,
  fs           = require('fs'),
  view         = require('./view');

exports.version = [0,3,22];

exports.middleware = middleware;

/**
 * A request to a bogart router
 */
function Request() {}

/**
 * Creates a request object given a router and a jsgi request.
 * This function is primarily intended to be used internally by bogart; however, it could be
 * used by a third party library to compose bogart routers with its own handling mechanisms.
 *
 * @type Request
 */
exports.request = function(router, jsgiReq) {
  var
    search        = util.extractSearch(jsgiReq),
    requestedWith = jsgiReq.headers['x-requested-with'],
    isxhr         = !util.no(requestedWith), parsedBody,
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

/**
 * Creates a @see ViewEngine
 *
 * Example:
 *     bogart.viewEngine("mustache", require("path").join(__dirname, "/templates"))
 *
 * @param {String} engineName  the name of the engine, available: ["mustache", "haml"]
 * @param {String} viewsPath   Path where the views are located.  Defaults to /views
 * @member bogart
 */
exports.viewEngine = view.viewEngine;

/**
 * Deprecated, use bogart#router instead
 * @ignore
 */
exports.app = function(config, notFoundApp) {
  console.log("app is deprecated, please use bogart.router");
  
  return exports.router(config, notFoundApp);
};

/**
 * Creates a bogart router.  A router is responsible for routing requests to appropriate handlers.
 *
 * Example:
 *     bogart.router(function(get, post, put, del) {
 *       get('/', function() { return bogart.html('Hello World'); });
 *     });
 *
 * Alternative:
 *     var router = bogart.router();
 *     router.get('/', function() { return bogart.html('Hello World'); });
 *
 * @param {Function} config       DSL configuration of routes.
 * @param {Function} notFoundApp  JSGI application to execute when no route from config matches the request.
 */
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
    router = new Router(config),
    fn;
  
  fn = function(req) {
    var resp;
    try {
      respPromise = router.respond(exports.request(this, req));
      if(util.no(respPromise) && req.pathInfo !== "/routes") {
        if (notFoundApp) { 
          return notFoundApp(req); 
        }
        else { 
          return defaultNotFoundApp(req);
        }
      }
      if (util.no(respPromise) && req.pathInfo === '/routes') {
        var str = 'GET<br />';

        router.routes['get'].forEach(function(r) {
          str += '<p>';
          str += 'path: ' + r.path + '<br />' + 'paramNames: ' + r.paramNames;
          str += '</p>';
        });

        return { status: 200, headers: { 'Content-Length': str.length, "Content-Type":"text/html" }, body: [ str ] };
      }

      return when(respPromise, function(resp) {
        if (util.no(resp.status)) {
          throw new Error('Response must have "status" property');
        }
        if (util.no(resp.body)) {
          throw new Error('Response must have "body" property');
        }
        if (typeof resp.body.forEach !== 'function') {
          throw new Error('Response "body" property must have a forEach method');
        }

        return resp;
      });
    } catch (err) {
      var str = 'Error';
      if (err && err.toString) {
        str += '<br />'+err.toString();
      }
      if (err && err.stack) {
        str += '<br />'+JSON.stringify(err.stack);
      }
      return exports.html(str, { status: 500 });
    }
  };

  ['get','post','put','del','before','after'].forEach(function(x) {
    fn[x] = router[x].bind(router);
  });

  return fn;
};

/**
 * Deprecated, use bogart#build instead
 * @ignore
 */
exports.server = function(config) {
  console.log("'bogart.server' is deprecated, please switch to 'bogart.build'");
  return exports.build(config);
}

/**
 * Utility class to help in creating stacks of JSGI applications.
 * Allows the removal of nesting.
 *  
 * @param {Function} config   A configuration function that will be called by exports.build.  The function will be
 *                            be provided via its 'this' reference two functions: use, clear
 *
 * @returns {Function} A JSGI application that can be started using @see bogart#start
 */
exports.build = function(config) {
  var
    self = this,
    app;
  
  this.middleware = [];
  
  this.use = function() {
    this.middleware.push(Array.prototype.slice.call(arguments));
  };

  this.clear = function() {
    this.middleware = [];
  };
  
  this.use(middleware.Error);
  this.use(middleware.Parted);
  
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

/**
 * Starts a server
 *
 * @param {Function} jsgiApp   JSGI application to run
 * @param {Object} options     Options hash.  Supports 'port' property which allows specification of port for server.
 *                             Port defaults to 8080.  More options are planned for the future.
 */
exports.start = function(jsgiApp, options) {
  return require("jsgi").start(jsgiApp, options);
};

/**
 * Text response.  Bogart helper method to create a JSGI response.
 * Returns a default JSGI response with body containing the specified text, a status of 200,
 * and headers.  The headers included are "content-type" of "text" and "content-length" set
 * appropriately based upon the length of 'txt' parameter.
 *
 * @param {String} txt  Text for the body of the response.
 */
exports.text = function(txt) {
  return {
    status: 200,
    body: [txt],
    headers: { "content-type": "text", "content-length": Buffer.byteLength(txt, 'utf-8') }
  };
};

/**
 * HTML response.  Bogart helper method to create a JSGI response.
 * Returns a default JSGI response with body containing the specified html, a status of 200,
 * and headers.  The headers included are "content-type" of "text/html" and "content-length" set
 * appropriately based upon the length of the 'html' parameter.
 *
 * @param {String} html  HTML for the body of the response
 * @param {Object} opts  Options to override JSGI response defaults.  For example, passing { status: 404 } would
 *                       cause the resulting JSGI response's status to be 404.
 *
 * @returns JSGI Response
 * @type Object
 */ 
exports.html = function(html, opts) {
  opts = opts || {};
  html = html || "";
  
  return {
    status: opts.status || 200,
    body: [html],
    headers: { "content-type": "text/html", "content-length": Buffer.byteLength(html, 'utf-8') }
  };
};

/**
 * Bogart helper function to create a JSGI response.
 * Returns a default JSGI response with body containing the specified object represented as JSON, a status of 200,
 * and headers.  The headers included are "content-type" of "application/json" and "content-length" set 
 * appropriately based upon the length of the JSON representation of @paramref(obj)
 *
 *     var resp = bogart.json({ a: 1});
 *     sys.inspect(resp)  
 * 
 * Assuming node-style sys.inspect, evalutes to:
 * { 
 *   status: 200,
 *   headers: { "content-type": "application/json", "content-length": 5 },
 *   body: [ "{a:1}" ]
 * }
 *                               
 *
 * @param {Object} obj  Object to be represented as JSON
 * @param {Object} opts Options to override JSGI response defaults.  For example, passing {status: 404 } would 
 *                      cause the resulting JSGI response's status to be 404.
 */
exports.json = function(obj, opts) {
  opts = opts || {};
  
  var str = JSON.stringify(obj);
  
  return {
    status: opts.status || 200,
    body: [str],
    headers: { "content-type": "application/json", "content-length": Buffer.byteLength(str, 'utf-8') }
  };
};

exports.error = function(msg, opts) {
  opts = opts || {};
  msg = msg || "Server Error";
  
  return {
    status: opts.status || 500,
    body: [msg],
    headers: { "content-type": "text/html", "content-length": Buffer.byteLength(msg, 'utf-8') }
  };
};

/**
 * Bogart helper function to create a JSGI response.
 * Returns a default JSGI response the redirects to the url provided by the 'url' parameter.
 *
 *     var resp = bogart.redirect("http://google.com");
 *     sys.inspect(resp)  
 * 
 * Assuming node-style sys.inspect, evalutes to:
 * { 
 *   status: 302,
 *   headers: { "location": "http://google.com" },
 *   body: []
 * }
 *                               
 *
 * @param {String} url  URL to which the JSGI response will redirect
 * @returns JSGI response for a 302 redirect
 * @type Object
 */
exports.redirect = function(url, opts) {
  var resp = {
    status: 302,
    headers: { "location": url },
    body: []
  };

  if (opts) {
    if (opts.headers) {
      resp.headers = merge(resp.headers, opts.headers);
      delete opts.headers;
    }

    merge(resp, opts);
  }

  return resp;
};

/**
 * Bogart helper function to create a JSGI response.
 * Returns a default JSGI response the redirects to the url provided by the 'url' parameter.
 *
 *     var resp = bogart.permanentRedirect("http://google.com");
 *     sys.inspect(resp)  
 * 
 * Assuming node-style sys.inspect, evalutes to:
 * { 
 *   status: 301,
 *   headers: { "location": "http://google.com" },
 *   body: []
 * }
 *                               
 *
 * @param {String} url  URL to which the JSGI response will redirect
 * @returns JSGI response for a permanent (301) redirect
 * @type Object
 */
exports.permanentRedirect = function(url){
    return {
        status:301,
        headers: {"location": url},
        body: []
    };
};

/**
 * Bogart helper function to create a JSGI response.
 * Returns a default JSGI response with a status of 304 (not modified).
 *
 *     var resp = bogart.notModified();
 *     sys.inspect(resp)  
 * 
 * Assuming node-style sys.inspect, evalutes to:
 * { 
 *   status: 304,
 *   body: []
 * }
 *                               
 * @returns JSGI response for a not modified response (304).
 * @type Object
 */
exports.notModified = function(){
  return {
      status: 304,
      body:[]
  };  
};

/*
 * @deprecated
 */
exports.stream = function() {
  console.log('the stream method is deprecated and will be removed in Bogart 0.4.0');

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

var ResponseBuilder = exports.ResponseBuilder = function(viewEngine) {

  var responseBuilder = Object.create(Q.defer())
    , forEachCallback
    , forEachDeferred = Q.defer()
    , response = { headers: {}, status: 200, body: {} }
    , waiting = [];
  
  var send = function(data) {
    if (typeof data === 'string') {
      forEachCallback(data);
    } else if (typeof data.forEach === 'function') {
      data.forEach(forEachCallback);
    } else {
      forEachCallback(data);
    }
  };

  /**
   * Send response data
   *
   * Examples:
   *
   *    res.send('Hello World');
   *    res.send([ 'Hello', 'World' ]);
   *    res.send(new Buffer('Hello World'));
   *
   * @param {String | ForEachable | Buffer} data  Data to send
   * @api public
   */
  responseBuilder.send = function(data) {
    if (typeof forEachCallback === 'function') {
      send(data);
    } else {
      waiting.push(data);
    }
  };

  /**
   * Render a `view` to the response stream.
   *
   * Example:
   *
   *    res.render('index.html', { locals: { title: 'Hello World' } });
   *
   * @param {String} view  The view to render
   * @param {Object} opts  Options for the ViewEngine.
   */
  responseBuilder.render = function(view, opts) {
    if (!viewEngine) {
      throw "No viewEngine specified"
    }

    viewEngine.render(view, opts).then(function(content) {
      responseBuilder.send(content);
      responseBuilder.end();
    })
  };

  /**
   * End the response.
   */
  responseBuilder.end = function() {
    this.resolve(response);
    forEachDeferred.resolve();
  };

  responseBuilder.headers = function(headers) {
    response.headers = headers;
  };

  responseBuilder.setHeader = function(k,v) {
    response.headers = response.headers || {};
    response.headers[k] = v;
  }

  responseBuilder.status = function(status) {
    response.status = status;
  };

  Object.defineProperty(responseBuilder, 'statusCode', {
    set: function(value) {
      responseBuilder.status(value);
    }
  });

  response.body.forEach = function(callback) {

    forEachCallback = callback;

    if (waiting.length > 0) {
      waiting.forEach(send);
      waiting = [];
    }

    return forEachDeferred.promise;
  };

  return responseBuilder;
};

/**
 * Retrieve a ResponseBuilder to build a JSGI response imperatively.
 *
 *     var viewEngine = bogart.viewEngine('mustache');
 *     app.get('/', function(req) {
 *       var resp = bogart.response(viewEngine);
 *       
 *       doSomethingAsync(function(err, str) {
 *         if (err) {
 *           resp.status(500);
 *           resp.send('Error: '+err.reason);
 *         } else {
 *           resp.send(str);
 *         }
 *         resp.end();
 *       });
 *       
 *       return resp;
 *     });
 *
 * @param   {ViewEngine} viewEngine   The ViewEngine to be used by response helpers for rendering views.
 * @returns {ResponseBuilder}  An object with methods to help build a response.
 */
exports.response = function(viewEngine) {
  return new ResponseBuilder(viewEngine);
};

function pipeStream(stream, opts) {
  var response = exports.response();

  opts = opts || {};

  if (!stream.readable) {
    throw "Streams passed to pipe must be readable streams."
  }

  if (opts.status) {
    response.status(opts.status);
  }

  if (opts.headers) {
    response.headers(opts.headers);
  }

  stream.on('data', function(data) {
    response.send(data);
  });

  stream.on('end', function() {
    response.end();
  });

  stream.on('error', function(err) {
    response.reject(err);
  });

  return response.promise;  
};

/**
 * Pipe a response to a JSGI stream
 *
 * @param {ReadableStream} stream  A readable stream.
 * @returns {Promise} A promise for a JSGI stream.
 */
exports.pipe = function(stream, opts) {
  var deferred = Q.defer();

  if (typeof stream.forEach === 'function') {
    deferred.resolve(merge({}, opts, { body: stream }));
    return deferred.promise;
  } else {
    return pipeStream(stream, opts);
  }
};

/**
 * Get MIME type for a file extension
 *
 * @param {String} ext  File extension
 * @returns {String}  MIME type of file extension.
 */
exports.mimeType = function(ext) {
  var dotIndex = ext.lastIndexOf('.');
  if (dotIndex > 0) {
    ext = ext.substring(dotIndex);
  }

  return require("./mimetypes").mimeType(ext);
};

/**
 * Creates a JSGI response that streams a file
 *
 * @param {String} filePath  The path to the file to be streamed
 * @param {Object} opts      JSGI options
 *
 * @returns {Promise} A promise for a JSGI response
 */
exports.file = function(filePath, opts) {
  opts = opts || {};
  opts.headers = opts.headers || {};
  opts.headers['Content-Type'] = opts.headers['Content-Type'] || exports.mimeType(path.extname(filePath));

  return exports.pipe(fs.createReadStream(filePath), opts);
};

/**
 * Helper function to determine the main directory of the application
 * @returns {String} Directory of the script that was executed
 */
exports.maindir = function() {
  if (typeof require.main === 'undefined') {
    return __dirname;
  }
  return path.dirname(require.main.filename).replace("file://","");
};

view.setting('template directory', path.join(exports.maindir(), 'views'));

/**
 * Pipes data from source to dest.
 *
 * @param {ForEachable | ReadableStream} src   Source of data
 * @param {WriteableStream}              dest  Write data from src to dest
 *
 * @returns {Promise}  A promise that will be resolved when the pumping is completed
 */
exports.pump = require('./stream').pump;
