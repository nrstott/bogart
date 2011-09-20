var
  path      = require('path'),
  http      = require('http'),
  fs        = require('q-fs'),
  extname   = path.extname,
  promise   = require('q'),
  when      = promise.when,
  sys       = require('sys');

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
    views: { value: views || path.join(process.cwd(),"views"), enumerable: true, readonly: true },
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
    doRead = function(path) { return fs.read(path); },
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
      headers: opts.headers || [],
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
    renderer    = engine ? this[engine] : this[ext.substring(1)],
    layout      = opts.layout === undefined ? true : opts.layout;

  layout = layout === true ? 'layout' + ext : layout;

  return when(this.viewCache[viewPath] || this.cacheView(viewPath), 
    function success(str) {
      var renderedView = renderer(str, opts);

      if (layout) {
        opts.locals.body = renderedView;
        opts.layout = false;
        return self.render(layout, opts);
      }

      return renderedView;
    });
};

ViewEngine.prototype.partial = function(view, opts) {
  opts = opts || {};
  
  opts.locals = opts.locals || {};
      
  opts.partial = true;
  opts.layout  = false;
  
  return this.render(view, opts);
};

ViewEngine.prototype.mustache = function(str, opts) {
  return require('mustache').to_html(str, opts.locals);
};

ViewEngine.prototype.haml = function(str, opts) {
  var haml;
  try {
    haml = require('haml');
  } catch (err) {
    console.log("Could not require 'haml', please npm install haml or map it with nodules");
  }
  return haml.render(str, opts);
};

ViewEngine.prototype.jade = function(str, opts) {
  var jade;
  try {
    jade = require('jade');
  } catch (err) {
    throw "Could not require 'jade', please 'npm install jade'";
  }

  var fn = jade.compile(str, opts);
  return fn(opts.locals);
};
