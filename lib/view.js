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
  _         = require('underscore'),
  events    = require('events'),
  util      = require('util');

  // TODO: Figure out how to make this work x-platform using the nodules 'engines' overlay
  //watchFile = require('fileWatcher').watchFile;

var ViewEngine = exports.ViewEngine = function() {
  events.EventEmitter.call(this);
};

util.inherits(ViewEngine, events.EventEmitter);

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

/**
 * @api private
 */
ViewEngine.prototype.getCacher = function(path) {
  var self = this;
  return function(val) {
    self.viewCache[path] = val;
  }
}

ViewEngine.prototype.respond = function(view, opts) {
  opts = opts || {};
  
  return promise.whenCall(function() { return this.render(view, opts); }.bind(this), function(str) {
    return {
      status: opts.status || 200,
      headers: opts.headers || { 'content-type': 'text/html', 'content-length': Buffer.byteLength(str, 'utf-8') },
      body: [str]
    };
  }, function(err) {
    // Workaround for issue where whenCall calls rejectCallback even if one is not provided.
    throw err;
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
    function success(template) {
      var renderedView
        , cacher
        , jsName = setting('shared js name') || 'javascript'
        , namespace = setting('shared js namespace') || 'bogart';
      
      if (renderer === undefined || renderer === null) {
        throw new Error('Rendering engine not found for '+engine+'. Try `npm install bogart-'+engine+'`.');
      }
      
      if (opts._renderedShared !== true) {
        if (opts.locals[jsName]) {
          throw 'The locals property of `render` method options contains a property named "'+jsName+'" already. ' +
            'The view engine settings specify this name for the shared JavaScript. Please either change the "shared js name" settings ' +
            'by executing `var view = require("view"); view.setting("shared js name", "myNewName") or remove the code that is setting ' +
            'this property on the opts.locals.';
        }

        opts.locals[jsName] = '<script type="text/javascript">\n'+namespace+'={};\n';
        for (var k in self._shared) {
          opts.locals[jsName] += namespace+'["'+k+'"]='+self._shared[k].join('\n');
          opts.locals[jsName] += '\n';
        }
        opts.locals[jsName] += '</script>';

        opts._renderedShared = true;
      }

      self.emit('beforeRender', self, opts, template, cacher);

      cacher = self.getCacher(viewPath);
      renderedView = renderer(template, opts, cacher, self);

      self.emit('afterRender', self, opts, template, cacher);

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
 * Share JavaScript with the client side.
 */
ViewEngine.prototype.share = function(obj, name) {
  if (obj === undefined || obj === null) {
    throw 'Have to share something! First parameter to `ViewEngine.prototype.share` cannot be empty.';
  }

  this._shared = this._shared || {};
  this._shared[name] = this._shared[name] || [];

  if (typeof obj === 'string') {
    this._shared[name].push(obj);
  } else {
    this.share(stringify(obj), name);
  }

  return this;
};

/**
 * Inspect JavaScript that is shared with the client side.
 *
 * @params {String}  name  The key of the JavaScript to look up.
 * @returns {String}  JavaScript shared with the client for the `name` specified.
 */
ViewEngine.prototype.shared = function(name) {
  this._shared = this._shared || {};
  return this._shared[name].join('\n');
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

exports.viewEngine.addEngine('mustache', function(str, opts, cache, viewEngine) {
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

/**
 * Returns a string representation of an object.
 * This method is used for sharing objects with the client.
 *
 * @param {Object} obj  An object.
 * @returns {String} a string representation of the object.
 * @api private
 */
function stringify(obj) {
  if (Array.isArray(obj)) {
    return '['+obj.map(stringify).join(',')+']';
  } else if (obj instanceof Date) {
    return 'new Date("'+obj.toString()+'")';
  } else if (typeof obj === 'function') {
    return obj.toString();
  } else {
    return JSON.stringify(obj);
  }
}
