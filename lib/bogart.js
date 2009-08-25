var jsontemplate = require("jsontemplate").jsontemplate;
var Jack = require("jack");
var util =require("util");

(function() {
    var closure = this;

    var PATH_REPLACER = "([^\/]+)";
    var PATH_NAME_MATCHER = /:([\w\d]+)/g;

    var __get_cache__;
    var __route_cache__;
    if (typeof get != "undefined")
        __get_cache__ = get;
    if (typeof route != "undefined")
        __route_cache__ = route;

    this.Bogart = exports.Bogart = {
        noConflict: function() {
            closure.get = __get_cache__;
            closure.route = __route_cache__;
        }
    };

    Bogart.Version = "0.0.1";

    var APP_EVENTS = ['unload'];
    var ROUTE_VERBS = ['get','post','put','del'];

    Bogart.Base = Bogart.Base || function(appFn) {
        return Bogart.Base.fn.init(appFn);
    };

    var bogartBaseMembers = {
        _routes: {},

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
                }

                return route.callback.apply({ verb: verb,
                    path: path,
                    params: params,
                    jsontemplate: function(view, data) {
                        var path = require.main;
                        print(path);
                    },
                    request: self.request,
                    response: self.response
                });
            } 
        }
    };

    Bogart.Base.fn = Bogart.Base.prototype = {
        init: function(appFn) {
            var obj = util.deepCopy(bogartBaseMembers);

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

    exports.app = function(env) { return __app__.start(env); };
})();