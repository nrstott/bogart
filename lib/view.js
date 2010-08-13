var
  path    = require('path'),
  http    = require('http'),
  fs      = require('fs'),
  extname = path.extname,
  promise = require('promised-io/promise'),
  when    = promise.when,
  sys     = require('sys');

var ViewEngine = exports.ViewEngine = function(){};

/**
 * @param {bogart.Router} router
 * @returns {ViewEngine}
 */
exports.viewEngine = function(router) {
  return Object.create(new ViewEngine(), {
    router: { value: router, readonly: true },
    viewCache: { value: {} }
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

  fs.watchFile(path, function() { when(doRead(path), doCache) });
  return when(doRead(path), function(str) { doCache(str); return str;}); 
};

/**
 * @api private
 */
function viewRoot(router) {
  return router.setting('views') || process.cwd();
}

ViewEngine.prototype.render = function(view, opts) {
  opts = opts || {};
  
  opts.locals = opts.locals || {};

  var
    self        = this,
    viewPath    = path.join(viewRoot(this.router), view),
    ext         = extname(viewPath),
    engine      = this.router.setting('viewEngine'),
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
  return require('haml').render(str, opts);
};
