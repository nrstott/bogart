var
  path    = require('path'),
  http    = require('http'),
  fs      = require('fs'),
  extname = path.extname,
  promise = require('jsgi/promise'),
  when    = promise.when,
  sys     = require('sys')

/**
 * @param {bogart.Router} router
 * @returns {ViewEngine}
 */
exports.viewEngine = function(router) {
  return Object.create(new ViewEngine, {
    router: { value: router, readonly: true },
    viewCache: { value: {} }
  })
}

var ViewEngine = exports.ViewEngine = function(){}

ViewEngine.prototype.clearCache = function() {
  this.viewCache = {}
}

/**
 * @api private
 */
ViewEngine.prototype.cacheView = function(path) {
  var 
    self     = this,
    deferred = promise.defer()

  sys.puts('loading ' + path)
  when(promise.execute(fs.readFile, path, 'utf8'), function(str) { self.viewCache[path] = str; sys.puts(str); deferred.resolve(str) })

  return deferred.promise
}

/**
 * @api private
 */
function viewRoot(router) {
  return router.setting('view root') || process.cwd()
}

ViewEngine.prototype.render = function(view, opts) {
  opts = opts || {}
  
  opts.locals = opts.locals || {}

  var
    self        = this,
    viewPath    = path.join(viewRoot(this.router), view),
    deferRender = promise.defer()

  when(this.viewCache[viewPath] || this.cacheView(viewPath), 
    function success(str) {
      var 
	ext      = extname(viewPath),
	renderer = require(ext.substring(1))

      deferRender.resolve(renderer.render(str, opts))
    },
    function error(err) {
      deferRender.reject(err)
    })

  return deferRender.promise
}
