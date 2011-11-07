var
  path      = require('path'),
  http      = require('http'),
  fs        = require('fs'),
  extname   = path.extname,
  promise   = require('promised-io/lib/promise'),
  when      = promise.when,
  sys       = require('sys'),
  engines   = {},
  settings  = {},
  _         = require('underscore');

  // TODO: Figure out how to make this work x-platform using the nodules 'engines' overlay
  //watchFile = require('fileWatcher').watchFile;

var ViewEngine = exports.ViewEngine = function(){};

/**
 * @param {String} engineName  name of the engine 'mustache', 'haml'
 * @param {String} views       path to the views
 * @returns {ViewEngine}
 */
exports.viewEngine = function(engineName, views, opts) {
  return Object.create(new ViewEngine(), {
    engineName: { value: engineName, enumerable: true, readonly: true },
    views: { value: views || path.join(setting('template directory')), enumerable: true, readonly: true },
    viewCache: { value: {} },
    opts: { value: opts || { cache: false } }
  });
};

ViewEngine.prototype.clearCache = function() {
  this.viewCache = {};
};

/**
 * @api private
 */
ViewEngine.prototype.cacheView = function(path) {
  var 
    self = this,
    doRead = function(path) { return promise.execute(fs.readFile, path, 'utf8'); },
    doCache = function(str) { self.viewCache[path] = str; };

  //watchFile(path, function() { when(doRead(path), doCache) });
  return when(doRead(path), function(str) {
    if (this.opts.cache) {
      doCache(str);
    }
    return str;
  }.bind(this)); 
};

ViewEngine.prototype.respond = function(view, opts) {
  opts = opts || {};
  
  return when(this.render(view, opts), function(str) {
    return {
      status: opts.status || 200,
      headers: opts.headers || { 'content-type': 'text/html', 'content-length': Buffer.byteLength(str, 'utf-8') },
      body: [str]
    };
  });
};

ViewEngine.prototype.render = function(view, opts) {
  opts = opts || {};
  
  opts.locals = opts.locals || {};

  var
    self        = this,
    viewPath    = path.join(this.views, view),
    ext         = extname(viewPath),
    engine      = this.engineName,
    renderer    = engine ? exports.viewEngine.engine(engine) : exports.viewEngine.engine(ext.substring(1)),
    layout      = opts.layout === undefined ? true : opts.layout;

  layout = layout === true ? 'layout' + ext : layout;

  return when(this.viewCache[viewPath] || this.cacheView(viewPath), 
    function success(str) {
      var renderedView = renderer(str, opts, self);

      return when(renderedView, function(renderedView) {
        if (layout) {
          opts.locals.body = renderedView;
          opts.layout = false;

          return self.render(layout, opts);
        }

        return renderedView;
      });
    });
};

ViewEngine.prototype.partial = function(view, opts) {
  opts = opts || {};
  
  opts.locals = opts.locals || {};
      
  opts.partial = true;
  opts.layout  = false;
  
  return this.render(view, opts);
};

/**
 * Add a template engine
 *
 * @param {String}    engineName  The name of the template engine
 * @param {Function}  render      Render a template given the templaet as a string and and options object
 *
 * @returns undefined
 */
exports.viewEngine.addEngine = function(engineName, render) {
  engines[engineName] = render;
};

/**
 * Remove a template engine
 *
 * @param   {String}    engineName  The name of the template engine
 * @returns undefined
 */
exports.viewEngine.removeEngine = function(engineName) {
  delete engines[engineName];
};

/**
 * Retrieves the render function for a registered template engine
 * 
 * @param {String}  engineName  The name of the template engine
 * @returns {Function}  Function registered to render templates of the type specified by engineName
 */
exports.viewEngine.engine = function(engineName) {
  return engines[engineName];
};

exports.viewEngine.addEngine('mustache', function(str, opts, viewEngine) {
  var partialPromises = []
    , partials = {}
    , viewPath;
  
  opts = _.extend({}, opts);

  if (opts.partials) {
    for (var k in opts.partials) {
      viewPath = path.join(viewEngine.views, opts.partials[k]);
      
      partialPromises.push(when(viewEngine.viewCache[viewPath] || viewEngine.cacheView(viewPath), function(str) {
        partials[k] = str;
        return str;
      }));
    }

    return promise.all(partialPromises).then(function() {
      delete opts.partials;

      return require('mustache').to_html(str, opts.locals, partials);
    });
  }

  return require('mustache').to_html(str, opts.locals);
});

var setting = exports.setting = function(key, val) {
  if (val !== undefined) {
    settings[key] = val;
    return this;
  }

  return settings[key];
};
