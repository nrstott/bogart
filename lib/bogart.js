var Jack = require("jack");
var util = require("util");
var system = require("system");
var FileSystemTemplateLocator = require("./bogart-ejs").FileSystemTemplateLocator;

var PATH_REPLACER = "([^\/]+)";
var PATH_NAME_MATCHER = /:([\w\d]+)/g;

var ROUTE_VERBS = ['GET','POST','PUT','DELETE'];

var Bogart = exports;

Bogart.Version = "0.0.1";

Bogart.Base = function(appFn) {
    return new Bogart.Base.fn.init(appFn);
};

var bogartBaseMembers = {
    _routes: {},

    _resources: [],

    layout: "",

    log: function(message){
        //print("Bogart [" + new Date() + "] " + message);;
    },

    staticContent: ["/public"],

    /**
     * Add a resource to handle routes beginning with path
     * @param path
     * @param resource
     */
    addResource: function(path, resource){
        if (path == undefined || path == null || path == "")
            throw new Error("Argument 'path' is required");

        if (!path[0] == "/")
            path = "/" + path;

        var paramNames = [];
        while (true) {
            var pathMatch = PATH_NAME_MATCHER.exec(path);
            if (pathMatch != null) {
                paramNames.push(pathMatch[1]);
            } else {
                break;
            }
        }
        path = new RegExp("^" + path.replace(PATH_NAME_MATCHER, PATH_REPLACER));

        this._resources.push({ path: path, resource: resource, paramNames: paramNames });
    },

    route: function(verb, path, callback) {
        if (ROUTE_VERBS.indexOf(verb.toUpperCase()) == -1)
            throw new Error("Unrecognized verb: " + verb);

        verb = verb.toUpperCase();

        // turn the path into a regular expression
        var paramNames = [];

        if (path.constructor == String) {
            while (true) {
                var pathMatch = PATH_NAME_MATCHER.exec(path);
                if (pathMatch != null) {
                    paramNames.push(pathMatch[1]);
                }
                else {
                    break;
                }
            }

            path = new RegExp(path.replace(PATH_NAME_MATCHER, PATH_REPLACER) + "$");
        }

        var r = {verb: verb, path: path, callback: callback, paramNames: paramNames};

        // create the routes array if it does not exist
        if (typeof this._routes[verb] == 'undefined' || this._routes[verb].length == 0) {
            this._routes[verb] = [r];
        } else {
            this._routes[verb].push(r);
        }

        return r;
    },

    /**
     *
     * @param env Jack environment
     */
    start: function(env) {
        var self = this;

        var app = function(env) {
            var verb = env["REQUEST_METHOD"].toUpperCase();
            self.request = new Jack.Request(env);
            self.response = new Jack.Response();

            return self.handleRoute(verb, self.request.relativeURI());
        };

        if (this.staticContent){
            ["js","css","images"].forEach(function(publicDir){
                var matchExp = new RegExp("^/" + publicDir);
                if (env["PATH_INFO"].match(matchExp))
                    env["PATH_INFO"] = "/public" + env["PATH_INFO"];
            });
            return Jack.Static(app, { urls: [this.staticContent] })(env);
        } else {
            return app(env);
        }
    },

    getRouteHandler: function(verb, path) {
        var routed = false;

        if (typeof this._routes[verb] != 'undefined'){
            for (var i=0;i<this._routes[verb].length;++i) {
                var route = this._routes[verb][i];
                if (path.match(route.path)) {
                    routed = route;
                }
            }
        }

        return routed;
    },

    handleRoute: function(verb, path, params) {
        var self = this;
        if (path.length > 1 && path[path.length - 1] == "/")
            path = path.substring(0, path.length - 1);

        params = params || {};

        // Check for a resource to handle teh route
        for (var i=0;i<this._resources.length;++i){
            var resourceRecord = this._resources[i];
            if (path.match(resourceRecord.path)) {
                var pathParams = resourceRecord.path.exec(path);
                if (pathParams) {
                    var fullPath = pathParams.shift();

                    pathParams.forEach(function(paramValue, indx) {
                        if (resourceRecord.paramNames.length - 1 >= indx) {
                            params[resourceRecord.paramNames[indx]] = paramValue;
                        } else {
                            params["splat"] = params["splat"] || [];
                            params["splat"].push(paramValue);
                        }
                    });
                }

                var resource = resourceRecord.resource;
                resource.request = this.request;
                resource.response = this.response;

                var modifiedPath = path.replace(resourceRecord.path, "");
                if (modifiedPath == "")
                    modifiedPath = "/";

                return resource.handleRoute(verb, modifiedPath, params);
            }
        }

        var route = this.getRouteHandler(verb, path);

        if (route) {
            var pathParams = route.path.exec(path);
            if (pathParams) {
                var fullPath = pathParams.shift();

                pathParams.forEach(function(paramValue, indx, array) {
                    if (route.paramNames.length - 1 >= indx) {
                        params[route.paramNames[indx]] = paramValue;
                    } else {
                        params["splat"] = params["splat"] || [];
                        params["splat"].push(paramValue);
                    }
                });

                if (typeof params["splat"] != "undefined" && params["splat"].length == 1) {
                    params["splat"] = params["splat"][0];
                }

                util.update(params, this.request.params());
            }

            var viewsRoot = self.viewsRoot;
            if (viewsRoot && !viewsRoot.match(/\/$/g))
                viewsRoot += "/";
            return route.callback.apply(new RouteHandlerContext( self.request, self.response, {
                verb: verb,
                params: params,
                layout: self.layout,
                viewsRoot: viewsRoot
            }));
        }
    }
};

function RouteHandlerContext(request, response, options) {
    options = options || {};

    this.request = request;
    this.response = response;
    this.verb = options.verb || "GET";
    this.params = options.params || {};
    this._layout = options.layout || null;

    var templateLocatorConfig = {};
    if (options.viewsRoot)
        templateLocatorConfig.viewsPath = options.viewsRoot;

    this.templateLocator = new FileSystemTemplateLocator(templateLocatorConfig);
}

RouteHandlerContext.prototype = {
    layout: function(path){
        this._layout = path;
    },
    ejs: function(viewName, model){
        model = model || {};

        var viewTemplate = this.templateLocator.getViewTemplate(viewName);
        var layoutTemplate = this.templateLocator.getLayoutTemplate(this._layout);

        var EjsLayoutRenderer = require("./bogart-ejs").EjsLayoutRenderer;
        var renderer = new EjsLayoutRenderer(layoutTemplate, this.request, this.templateLocator);
        var page = renderer.render(viewTemplate, model);

        this.response.write(page);
        return this.response.finish();
    },
    jsontemplate: function(viewName, model, options){
        var data = undefined;
        var self = this;

        model = util.deepCopy(model) || {};

        if (typeof model.model != undefined && model.model) {
            data = model;
        } else {
            data = { model: model };
        }

        print(data);

        var shouldFinishResponse = true;

        options = options || {};
        if (options.shouldFinishResponse == undefined) {
            shouldFinishResponse = true;
        } else {
            shouldFinishResponse = options.shouldFinishResponse;
        }

        var defaultValue = function(model, name){
            if (typeof model == undefined || typeof model == null) return "";
            if (typeof name == undefined || typeof name == null) return "";
            return model[name] || "";
        };

        var defaultValues = {};

        for (var key in model) {
            if (typeof model[key] == undefined || model[key] == null) {
                defaultValues[key] = defaultValue(model, key);
            } else {
                defaultValues[key] = model[key];
            }
        }

        util.update(data, defaultValues);

        var fs = require("file");
        var viewsDirectory = fs.path(require.main).dirname();
        var viewPath = fs.path(viewsDirectory.toString() + "/views/" + viewName + ".html.json");
        var rawTemplate = fs.read(viewPath, "+r");

        var raw = require("jsontemplate").jsontemplate.Template(new String(rawTemplate), { meta: options.meta || "{}" }).expand(data);

        if (shouldFinishResponse) {
            self.response.write(raw);
            return self.response.finish();
        }

        return raw;
    },
    json: function(obj){
        this.response.write(JSON.stringify(obj));
        return this.response.finish();
    },
    redirectTo: function(uri) {
        this.response.redirect(uri);
        return this.response.finish();
    },
    flash: {},
    session: {},
    cookies: {}
};

function addRouteMethods(obj){
    ROUTE_VERBS.forEach(function(verb){
        obj[verb] = function(path, callback) {
            return obj.route(verb, path, callback);
        };
    });
};

Bogart.Base.fn = Bogart.Base.prototype = {
    init: function(appFn) {
        util.update(this, util.deepCopy(bogartBaseMembers));
        this.constructor = Bogart.Base;

        addRouteMethods(this);

        appFn = appFn || function() {};
        appFn.apply(this);

        return this;
    }
};

Bogart.Base.fn.init.prototype = Bogart.Base.prototype;

Bogart.Resource = function(routeFn){
    util.update(this, util.deepCopy(bogartBaseMembers));

    addRouteMethods(this);

    if (routeFn instanceof Function)
        routeFn.apply(this);

    return this;
};

Bogart.Resource.prototype = Bogart.Base.prototype;
Bogart.Resource.prototype.constructor = Bogart.Resource;
