var Q = require('./q'),
  when = Q.when,
  fs = require('fs'),
  path = require('path'),
  ForEachStream = require('./forEachStream'),
  util = require('./util'),
  merge = util.merge,
  EventEmitter = require('events').EventEmitter,
  _ = require('underscore'),
  Router = require('./router').Router;

var middleware = function (handler) {
  return function factory(next) {
    if (next === undefined) {
      return function (next) {
        return factory(next);
      };
    }

    return function (req) {
      return handler(req, next);
    }
  }
};

module.exports = middleware;

function deprecate(oldName, newName, fn) {
  return function () {
    console.log(oldName + ' is deprecated, please use ' + newName + ' instead');
    return fn.apply(middleware, Array.prototype.slice.call(arguments));
  }
}

middleware.parseJson = require('./middleware/parseJson');
middleware.ParseJson = deprecate('ParseJson', 'parseJson', middleware.parseJson);

middleware.parseForm = require('./middleware/parseForm');
middleware.ParseForm = deprecate('ParseForm', 'parseForm', middleware.parseForm);

middleware.gzip = require('./middleware/gzip');
middleware.Gzip = deprecate('Gzip', 'gzip', middleware.gzip);

/**
 * Provides Rails-style HTTP method overriding via the _method parameter or X-HTTP-METHOD-OVERRIDE header
 * http://code.google.com/apis/gdata/docs/2.0/basics.html#UpdatingEntry
 */
middleware.methodOverride = require('./middleware/methodOverride');
middleware.MethodOverride = deprecate('MethodOverride', 'methodOverride', middleware.methodOverride);

middleware.parted = require('./middleware/parted');
middleware.Parted = deprecate('Parted', 'parted', middleware.parted);

/**
 * Translates rejected promises to a JSGI error response.
 *
 * @param errorResponse {Function}  Optional. A function that returns a JSGI response when passed an error.
 * @returns {Function} JSGI response.
 */
middleware.error = require('./middleware/error');
middleware.Error = deprecate('Error', 'error', middleware.error);

/**
 * Validates that the response from nextApp is a valid JSGI response.
 * Rejects the promise if the response is invalid.
 *
 * @param {Function} nextApp  The next application in the JSGI chain.
 * @returns {Function} JSGI response.
 */
middleware.validateResponse = require('./middleware/validateResponse');
middleware.ValidateResponse = deprecate('ValidateResponse', 'validateResponse', middleware.validateResponse);

middleware.directory = require('./middleware/directory');
middleware.Directory = deprecate('Directory', 'directory', middleware.directory);

middleware.flash = require('./middleware/flash');
middleware.Flash = deprecate('Flash', 'flash', middleware.flash);

/**
 * Creates a OAuth2 section to auth routes requiring oauth2
 *
 */
middleware.oauth2 = require('./middleware/oauth2');

middleware.facebook = require('./middleware/facebook');

middleware.google = require('./middleware/google');

middleware.session = middleware.Session = require("./middleware/session/session").Session;

/**
 * Adapts Node.JS Buffer and Stream types used as response bodies into
 * a CommonJS ForEachable.
 *
 * @param {Function} nextApp  The next application in the JSGI chain.
 * @returns {Function} JSGI Application.
 */
middleware.bodyAdapter = require('./middleware/bodyAdapter');

/**
 * Translates strings into JSGI response objects.
 *
 * The default response has a status of 200 and a "Content-Type" header of "text/html"
 *
 * @param {Object} responseDefaults  Optional parameter. If stringReturnAdapter is called with one argument, that argument is assumed to be nextApp, not responseDefaults.
 * @param {Function} nextApp Next application in the JSGI chain.
 *
 * @returns {Function} JSGI Application.
 */
middleware.stringReturnAdapter = require('./middleware/stringReturnAdapter');

/**
 * JSGI Middleware that tries a series of JSGI Applications in order until one succeeds the `accept` test.
 * The first parameter is expected to be a function that will be called with the values returned by the applications.
 * The `accept` function must return a boolean indicating whether this response is the one that should be returned or
 * the next application in the series should be called.
 *
 *  var cascade = bogart.middleware.cascade(function(res) { return res.status !== 404 }, 
 *            function(req) {
 *              return {
 *                status: 404,
 *                headers: {}
 *                body: []
 *              };
 *            }, function(req) {
 *             return {
 *               status: 200,
 *               headers: { 'Content-Type': 'text/html' },
 *               body: [ 'Hello World' ]
 *             };
 *            });
 *  cascade(req); // The 2nd middleware function's return would be accepted and would become the return from cascade.
 *
 * @params {Function} accept  A function `function(res) {}` that takes a response and returns a boolean.
 * @params {Function} apps  The rest of the arguments are used as applications to cascade through.
 *
 * @returns {Promise} JSGI Response
 */
middleware.cascade = require('./middleware/cascade');

/*
 * Configuration factory for `bogart.batteries`.
 *
 * @param {Object} overrides  Optional prameter providing overrides
 *                            for default configuration options.
 *
 * @api private
 */
function batteriesConfig(overrides) {
  overrides = overrides || {};

  return _.extend({}, batteriesConfig.default, overrides);
};

batteriesConfig.default = {
  directory: 'public'
};

/**
 * All the goodies in one convenient middleware.
 *
 * Includes the following JSGI Chain:
 *
 * error -> validateResponse -> gzip -> directory -> parted -> methodOverride 
 *     -> session -> flash -> bodyAdapter -> stringReturnAdapter -> nextApp
 *
 * @param {Object} config   Optional configuration, if arity is two first parameter is config.
 * @param {Function} nextApp  The next application (Middleware, Bogart Router, etc...) in the JSGI chain.
 * @returns {Function} A good default middleware stack in one function call.
 */
middleware.batteries = function(config, nextApp) {
  if (nextApp === undefined) {
    if (typeof config === 'function') {
      nextApp = config;

      config = null;
    } else {
      return function (nextApp) {
        return middleware.batteries(config, nextApp);
      };
    }
  }

  config = batteriesConfig(config);

  if (!nextApp) {
    throw 'Bogart batteries requires at least one parameter, a nextApp to execute to fulfill the request.'
  }

  var stack = middleware.error(
    middleware.gzip(
      middleware.directory(config.directory,
        middleware.parted(config.parted || undefined,
          middleware.methodOverride(
            middleware.session(config.session || undefined,
              middleware.flash(config.flash || undefined,
                middleware.bodyAdapter(
                  middleware.stringReturnAdapter(nextApp)))))))));

  return stack;
};
