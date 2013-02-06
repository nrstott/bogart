var q = require('promised-io/promise');

/**
 * Wraps a Node.JS style asynchronous function `function(err, result) {}` 
 * to return a `Promise`.
 *
 * @param {Function} nodeAsyncFn  A node style async function expecting a callback as its last parameter.
 * @param {Object}   context      Optional, if provided nodeAsyncFn is run with `this` being `context`.
 *
 * @returns {Function} A function that returns a promise.
 */
q.promisify = function(nodeAsyncFn, context) {
  return function() {
    var defer = q.defer()
      , args = Array.prototype.slice.call(arguments);

    args.push(function(err, val) {
      if (err !== null) {
        return defer.reject(err);
      }

      return defer.resolve(val);
    });

    nodeAsyncFn.apply(context || {}, args);

    return defer.promise;
  };
};

if (!q.resolve) {
  q.resolve = function(val) {
    var deferred = q.defer();

    deferred.resolve(val);

    return deferred.promise;
  };
}

if (!q.reject) {
  q.reject = function(reason) {
    var deferred = q.defer();

    deferred.reject(reason);

    return deferred.promise;
  }  
}

module.exports = q;
