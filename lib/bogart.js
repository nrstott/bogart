var Jack = require("jack");
var util = require("util");
var system = require("system");

(function() {
    var closure = this;

    var PATH_REPLACER = "([^\/]+)";
    var PATH_NAME_MATCHER = /:([\w\d]+)/g;
    
    var ROUTE_VERBS = ['get','post','put','del'];

    var globalsCache = {};

    ROUTE_VERBS.forEach(function(verb) {
        if (typeof system.global[verb] != "undefined")
            globalsCache[verb] = system.global[verb];
        else
            globalsCache[verb] = undefined;
    });
    globalsCache.route = system.global.route;

    this.Bogart = exports.Bogart = {
        noConflict: function() {
            ROUTE_VERBS.forEach(function(verb) {
                closure[verb] = globalsCache[verb];
            });
            closure.route = globalsCache.route;
        }
    };

    Bogart.Version = "0.0.1";

    Bogart.Base = Bogart.Base || function(appFn) {
        return Bogart.Base.fn.init(appFn);
    };

    var bogartBaseMembers = {
        _routes: {},

        log: function(message){
            //print("Bogart [" + new Date() + "] " + message);;
        },

        route: function(verb, path, callback) {
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
            var verb = env["REQUEST_METHOD"].toLowerCase();
            this.request = new Jack.Request(env);
            this.response = new Jack.Response();

            return this.handleRoute(verb, this.request.relativeURI());
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

            params = params || {};

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

                    this.log("\n\n\nParameters for Request: " + JSON.stringify(this.request.params()));
                    this.log("\n\n\n");
                    util.update(params, this.request.params());


                }

                return route.callback.apply({ verb: verb,
                    path: path,
                    params: params,
                    partialJsonT: function(viewName, model, options) {
                        options = options || {};

                        util.update(options, { shouldFinishResponse: false });

                        return this.jsonT(viewName, model, options);
                    },
                    jsonT: function(viewName, model, options) {
                        var data = undefined;

                        model = util.deepCopy(model) || {};
                        print("------ " + model.toSource());

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

                        var meta = options.meta || "{}";

                        var fs = require("file");
                        var viewsDirectory = fs.path(require.main).dirname();
                        var viewPath = fs.path(viewsDirectory.toString() + "/views/" + viewName + ".html.json");
                        var template = fs.read(viewPath, "+r");

                        var formPrefix = model.docType ? model.docType : "";
                        var defaultValue = function(model, name){
                            if (typeof model == undefined || typeof model == null) return "";
                            if (typeof name == undefined || typeof name == null) return "";
                            return model[name] || "";
                        };

                        var mangleId = function(name) {
                            return formPrefix + "_" + name;
                        };

                        var mangleName = function(name) {
                            return formPrefix + "[" + name + "]";
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

                        print(data.toSource());

                        var raw = require("jsontemplate").jsontemplate.Template(template, { meta: meta }).expand(data);

                        self.log("\n\n\n");
                        self.log("-------raw: " + raw);
                        self.log("\n\n\n");

                        if (shouldFinishResponse) {
                            self.log("\n\n\nFinish Response\n\n\n");
                            self.response.write(raw);
                            return self.response.finish();
                        }

                        return raw;
                    },
                    request: self.request,
                    response: self.response,
                    redirectTo: function(uri) {
                        self.response.redirect(uri);
                        return self.response.finish();
                    },
                    flash: {}
                });
            }
        }
    };

    Bogart.Base.fn = Bogart.Base.prototype = {
        init: function(appFn) {
            var obj = util.deepCopy(bogartBaseMembers);
            obj.constructor = Bogart.Base;

            ROUTE_VERBS.forEach(function(verb) {
                obj[verb] = function(path, callback) {
                    return obj.route(verb, path, callback);
                };
            });

            appFn = appFn || function() {};
            appFn.apply(obj);

            return obj;
        }
    };

    var __app__ = exports.baseApp = new Bogart.Base();
    __app__.get(/\/js\/(.*)/, function() {
        return this.redirectTo("/public/js/" + this.params["splat"]);
    });
    __app__.get(/\/css\/(.*)/, function() {
        return this.redirectTo("/public/css/" + this.params["splat"]);
    });
    __app__.get(/\/images\/(.*)/, function() {
        return this.redirectTo("/public/images/" + this.params["splat"]);
    });

    this.get = exports.get = function(path, callback) { __app__.get(path, callback); };
    this.post = exports.post = function(path, callback) { __app__.post(path, callback); };
    this.put = exports.put = function(path, callback) { __app__.put(path, callback); };
    this.del = exports.del = function(path, callback) { __app__.del(path, callback); };

    this.route = exports.route = function(verb, path, callback) { __app__.route(verb, path, callback); };

    var developmentEnv = function(app) {
        return require("jack/commonlogger").CommonLogger(
                require("jack/showexceptions").ShowExceptions(
                        require("jack/lint").Lint(
                                require("jack/contentlength").ContentLength(app))));
    };

    exports.app = Jack.Static(function(env) { return __app__.start(env); }, { urls: ["/public/js","/public/css","/public/images"] });
})();
