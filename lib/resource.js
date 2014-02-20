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

  registerUrlCallback(this.listLink(), function (req) {
    var res = self.list(req.params.limit, req.params.offset);

    req.resourceRoute = 'list';

    return q(res).then(respond(req));
  });

  registerUrlCallback(this.newLink(), function (req) {
    var res = self.new();

    req.resourceRoute = 'new';

    return q(res).then(respond(req));
  });

  registerUrlCallback(this.editLink(':id'), function (req) {
    var res = self.edit(req.params.id);

    req.resourceRoute = 'edit';

    return q(res).then(respond(req));
  });

  registerUrlCallback(this.createLink(), function (req) {
    var res = self.create(req.params);

    req.resourceRoute = 'create';

    return q(res).then(function (id) {
      return bogart.redirect(self.showLink(id).url);
    });
  });

  registerUrlCallback(this.showLink(':id'), function (req) {
    var res = self.show(req.params.id);

    req.resourceRoute = 'show';

    return q(res).then(respond(req));
  });

  registerUrlCallback(this.updateLink(':id'), function (req) {
    var res = self.update(req.params.id, req.params);

    req.resourceRoute = 'update';

    return q(res).then(function () {
      return bogart.redirect(self.updateLink(req.params.id));
    });
  })

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
      new: this.newLink(),
      create: this.createLink(),
      list: this.listLink()
    };

    if (res.id) {
      defaultLinks = _.extend(defaultLinks, {
        update: this.updateLink(res.id),
        destroy: this.destroyLink(res.id),
        show: this.showLink(res.id)
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
   * Returns the link used to access this resource's list route.
   * A Link has two properties: url and method.
   *
   * @returns {String} Link for list route.
   */
  listLink: function () {
    return link(this.routePrefix, '/');
  },

  /**
   * Returns the link used to access this resource's show route.
   * A Link has two properties: url and method.
   *
   * @returns {String} Link for show route.
   */
  showLink: function (id) {
    return link(this.routePrefix, '/'+id);
  },

  /**
   * Returns the Link used to access this resource's create route.
   * A Link has two properties: url and method.
   *
   * @returns {Object} Link for create route.
   */
  createLink: function () {
    return link(this.routePrefix, '/', 'post');
  },

  /**
   * Returns the link used to access this resource's update route.
   * A Link has two properties: url and method.
   *
   * @returns {String} Link for update route.
   */
  updateLink: function (id) {
    return link(this.routePrefix, '/'+id, 'put');
  },

  /**
   * Returns the link used to access this resource's destroy route.
   * A Link has two properties: url and method.
   *
   * @returns {String} Link for destroy route.
   */
  destroyLink: function (id) {
    return link(this.routePrefix, '/'+id, 'delete');
  },

  /**
   * Returns the link used to access this resource's new route.
   *
   * @returns {String} Link for new route.
   */
  newLink: function () {
    return link(this.routePrefix, '/new');
  },

  /**
   * Returns the URL used to access this resource's edit route.
   * A Link has two properties: url and method.
   *
   * @returns {String} Link for edit route.
   */
  editLink: function (id) {
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

    var templateName = req.resourceRoute+'.hmtl';
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
