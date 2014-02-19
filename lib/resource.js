'use strict'

var path = require('path')
  , bogart = require('./bogart')
  , Router = require('./router').Router
  , Negotiator = require('negotiator')
  , _ = require('underscore');

/**
 * Creates a Resource.
 */
function Resource(name, viewEngine) {
  var self = this;

  if (!name || name.length === 0) {
    throw new Error('Resource requires a name parameter e.g. new Resource("foo")');
  }

  this.respond = this.respond.bind(this);

  this.viewEngine = viewEngine;
  this.name = name;

  this.format = new Format(name, viewEngine);

  this.routePrefix = name;
  if (this.routePrefix[0] !== '/') {
    this.routePrefix = '/'+this.routePrefix;
  }

  this.router = new Router();

  this.router.get(this.routePrefix, function (req) {
    var res = self.list(req.params.limit, req.params.offset);

    return self.respond(req, res);
  });

  this.router.get(this.routePrefix+'/new', function (req) {
    var res = self.new();

    return q(res).then(function (res) {
      res.link.create = this.routePrefix+'/create';
      return self.respond(req, res);
    });
  });

  this.router.get(this.routePrefix+'/edit/:id', function (req) {
    var res = self.edit(req.params.id);

    return q(res).then(function (res) {
      res.link.update = this.routePrefix+'/update';
      return self.respond(req, res);  
    });
  });
}


Resource.Negotiator = Negotiator;

Resource.prototype = {
  /**
   * Coerces the return value of a resource method into
   * a Bogart Response.
   *
   * @param {Object} res The raw response.
   * @returns {Response} Bogart Response
   */
  respond: function (req, res) {
    var negotiator = new Resource.Negotiator(req);
    var preferredMediaType = negotiator.preferredMediaType(this.format.accepts);

    return this.format[preferredMediaType](req, res);
  },

  list: function (limit, offset) {
    throw new NotImplementedError('list');
  },

  show: function (id) {
    throw new NotImplementedError('show');
  },

  edit: function (id) {
    throw new NotImplementedError('edit');
  },

  update: function (id, properties) {
    throw new NotImplementedError('update');
  },

  new: function (properties) {
    throw new NotImplementedError('new');
  },

  create: function (properties) {
    throw new NotImplementedError('create');
  },

  destroy: function (id) {
    throw new NotImplementedError('destroy');
  }
};

function Format(name, viewEngine) {
  return Object.create(Format.prototype, {
    name: {
      enumerable: false,
      value: name
    },
    viewEngine: {
      enumerable: false,
      value: viewEngine
    }
  });
}

Format.prototype = {
  'text/html': function (req, entity) {
    if (!this.viewEngine) {
      throw new Error('text/html support requires a viewEngine to be set');
    }

    var templateName = path.basename(req.pathInfo);
    var templatePath = this.name;

    if (templateName === templatePath) {
      templateName = 'list';
    }

    return this.viewEngine.respond(path.join(templatePath, templateName+'.html'), {
      locals: entity
    });
  },

  'application/json': function (entity) {

  }
};

Object.defineProperty(Format.prototype, 'accepts', {
  get: function () {
    var obj = this;

    var accepts = [];

    while (obj !== null) {
      accepts = accepts.concat(Object.keys(obj));
      obj = Object.getPrototypeOf(obj);
    }

    return _.uniq(accepts);
  },

  enumerable: false
});

Resource.NotImplementedError = NotImplementedError;
function NotImplementedError(method) {
  Error.call(this, method+' should be implemented by an inheriting Resource');
};

NotImplementedError.prototype = Object.create(Error.prototype);

module.exports = Resource;
