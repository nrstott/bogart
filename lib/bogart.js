var Jack = require("jack"),
        Request = Jack.Request,
        util = require("util"),
        system = require("system"),
        logger = require("bogart-log"),
        FileSystemTemplateLocator = require("./bogart-ejs").FileSystemTemplateLocator,
        PATH_REPLACER = "([^\/]+)",
        PATH_NAME_MATCHER = /:([\w\d]+)/g,
        ROUTE_VERBS = ['GET','POST','PUT','DELETE'],
        Bogart = exports,
        bind;

Function.prototype.bind = Function.prototype.bind || function () {
    var args = Array.prototype.slice.call(arguments);
    var self = this;
    var bound = function () {
        return self.call.apply(self, args.concat(Array.prototype.slice.call(arguments)));
    };
    bound.name = this.name;
    bound.displayName = this.displayName;
    bound.length = this.length;
    bound.unbound = self;
    return bound;
};

Bogart.Version = "0.0.1";

Bogart.App = function(app, options) {
    options = options || {};

    var routes = {};
    var appFn;

    if (options instanceof Function){
        appFn = options;
    } else {
        appFn = options.init || function() {};
    }

    this.layout = "";
    this.staticContent = ["/public"];

    this.log = function(val){
        if (val != undefined)
            logger = val;
        else
            return logger;
    };

    this.route = function(verb, path, callback) {
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

            path = new RegExp(path.replace(PATH_NAME_MATCHER, PATH_REPLACER) + "($|(\\?.+)$)");
        }

        var r = {verb: verb, path: path, callback: callback, paramNames: paramNames};

        if (typeof routes[verb] == 'undefined' || routes[verb].length == 0) {
            // create the routes array if it does not exist
            routes[verb] = [r];
        } else {
            routes[verb].push(r);
        }

        return r;
    };

    this.getRouteHandler = function(verb, path) {
        var routed = false;

        if (typeof routes[verb] != 'undefined'){
            for (var i=0;i<routes[verb].length;++i) {
                var route = routes[verb][i];
                if (path.match(route.path)) {
                    routed = route;
                }
            }
        }

        return routed;
    };
    
    this.handleRoute = function(verb, path, params) {
        var self = this,
                pathParams = null;
        if (path.length > 1 && path[path.length - 1] == "/")
            path = path.substring(0, path.length - 1);

        params = params || {};

        var route = this.getRouteHandler(verb, path);

        if (!route) {
            this.response.status = 404;
            this.response.write("No route found that matches '" + verb + ": " + path + "'");
            return this.response.finish();
        }

        pathParams = route.path.exec(path);
        if (pathParams) {
            pathParams.shift();

            pathParams.forEach(function(paramValue, indx, array) {
                paramValue = unescape(paramValue);
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
        var result =  route.callback.call(new RouteHandlerContext(self.env, self.response, {
            verb: verb,
            params: params,
            layout: self.layout,
            viewsRoot: viewsRoot
        }));

        return result || self.response.finish();
    };

    addRouteMethods(this);

    appFn.call(this);

    /**
     *
     * @param env Jack environment
     */
    var middleware = function(env) {
        var verb = env["REQUEST_METHOD"].toUpperCase();
        var routeResponse, appResponse;

        this.env = env;
        this.request = new Jack.Request(env);
        this.response = new Jack.Response();

        routeResponse = this.handleRoute(verb, this.request.relativeURI());
        appResponse = app(env);

        if (routeResponse.status === 404 && appResponse != undefined && appResponse != null) {
            routeResponse = appResponse;
        }

        return routeResponse;
    };

    middleware = middleware.bind(this);

    if (this.staticContent){
        var oldMiddleware = middleware;
        middleware = Jack.Static(function(env) {
            ["js","css","images"].forEach(function(publicDir){
                var matchExp = new RegExp("^/" + publicDir);
                if (env["PATH_INFO"].match(matchExp))
                    env["PATH_INFO"] = "/public" + env["PATH_INFO"];
            });

            return oldMiddleware(env);
        }, { urls: [this.staticContent] });
    }

    return Jack.MethodOverride(middleware);
};

function RouteHandlerContext(env, response, options) {
    if (env == undefined)
        throw new Error("Argument undefined error: expected 'env'");

    options = options || {};

    var layoutPath = options.layout || null;

    this.env = env;
    this.request = new Request(env);
    this.response = response;
    this.verb = options.verb || "GET";
    this.params = options.params || {};

    this.layout = function(path) {
        if (path != undefined)
            layoutPath = path;
        return layoutPath;
    };

    var templateLocatorConfig = {};
    if (options.viewsRoot)
        templateLocatorConfig.viewsPath = options.viewsRoot;

    this.templateLocator = new FileSystemTemplateLocator(templateLocatorConfig);
}

RouteHandlerContext.prototype = {
    ejs: function(viewName, model){
        model = model || {};

        var viewTemplate = this.templateLocator.getViewTemplate(viewName);
        var layoutTemplate = this.templateLocator.getLayoutTemplate(this.layout());

        var EjsLayoutRenderer = require("./bogart-ejs").EjsLayoutRenderer;
        var renderer = new EjsLayoutRenderer(layoutTemplate, this.env, this.templateLocator);
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
    text: function(str){
        this.response.write(str);
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

Bogart.App.fn = Bogart.App.prototype = {
    init: function(appFn) {
    }
};

Bogart.App.fn.init.prototype = Bogart.App.prototype;

Bogart.Router = function(routeFn){
    util.update(this, new Bogart.App());

    addRouteMethods(this);

    if (routeFn instanceof Function)
        routeFn.apply(this);

    return this;
};

Bogart.Router.prototype = Bogart.App.prototype;
Bogart.Router.prototype.constructor = Bogart.Router;

Bogart.Router.extend = function(name, fnInit) {
    return new Bogart.Router(fnInit);
};
