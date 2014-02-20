'use strict'

var path = require('path')
  , bogart = require('./bogart')
  , Router = require('./router').Router
  , Negotiator = require('negotiator')
  , _ = require('underscore')
  , q = require('q');

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

  registerUrlCallback(this.listUrl(), function (req) {
    var res = self.list(req.params.limit, req.params.offset);

    return q(res).then(respond(req));
  });

  registerUrlCallback(this.newUrl(), function (req) {
    var res = self.new();

    return q(res).then(respond(req));
  });

  registerUrlCallback(this.editUrl(':id'), function (req) {
    var res = self.edit(req.params.id);

    return q(res).then(respond(req));
  });

  registerUrlCallback(this.createUrl(), function (req) {
    var res = self.create(req.params);

    return q(res).then(function (id) {
      return bogart.redirect(self.showUrl(id).url);
    });
  });

  registerUrlCallback(this.showUrl(':id'), function (req) {
    var res = self.show(req.params.id);

    return q(res).then(respond(req));
  });

  function registerUrlCallback(link, callback) {
    self.router[link.method](link.url, callback);
  }

  function respond(req) {
    return function (res) {
      return self.respond(req, res);
    };
  }
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

    return this.format[preferredMediaType](req, this._resWithLinks(res));
  },

  _resWithLinks: function (res) {
    var defaultLinks = {
      new: this.newUrl(),
      create: this.createUrl(),
      list: this.listUrl()
    };

    if (res.id) {
      defaultLinks = _.extend(defaultLinks, {
        update: this.updateUrl(res.id),
        destroy: this.destroyUrl(res.id),
        show: this.showUrl(res.id)
      });
    }

    res.links = _.defaults(res.links || {}, defaultLinks);

    return res;
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
  },

  /**
   * Returns the URL used to access this resource's list route.
   *
   * @returns {String} URL for list route.
   */
  listUrl: function () {
    return link(this.routePrefix, '/');
  },

  /**
   * Returns the URL used to access this resource's show route.
   *
   * @returns {String} URL for show route.
   */
  showUrl: function (id) {
    return link(this.routePrefix, '/'+id);
  },

  /**
   * Returns the URL used to access this resource's create route.
   *
   * @returns {String} URL for list route.
   */
  createUrl: function () {
    return link(this.routePrefix, '/', 'post');
  },

  /**
   * Returns the URL used to access this resource's update route.
   *
   * @returns {String} URL for list route.
   */
  updateUrl: function (id) {
    return link(this.routePrefix, '/'+id, 'put');
  },

  /**
   * Returns the URL used to access this resource's destroy route.
   *
   * @returns {String} URL for list route.
   */
  destroyUrl: function (id) {
    return link(this.routePrefix, '/'+id, 'delete');
  },

  /**
   * Returns the URL used to access this resource's new route.
   *
   * @returns {String} URL for list route.
   */
  newUrl: function () {
    return link(this.routePrefix, '/new');
  },

  /**
   * Returns the URL used to access this resource's edit route.
   *
   * @returns {String} URL for list route.
   */
  editUrl: function (id) {
    return link(this.routePrefix, '/edit/'+id);
  }
};

function link(routePrefix, url, method) {
  method = method || 'get';

  return {
    url: formatUrlForLink(),
    method: method
  };

  function formatUrlForLink() {
    if (url.length === 0 || (url.length === 1 && url[0] === '/')) {
      return routePrefix;
    }

    if (url[0] !== '/') {
      url = '/'+url;
    }

    return routePrefix + url;
  }
}

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
