var q = require('q')
  , slice = Array.prototype.slice;

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
      , args = slice.call(arguments);

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

if (!q.execute) {
  /**
   * Runs a Node.JS style asynchronous function `function(err, result) {}`, but returns a Promise instead.
   * @param {Function} Node.JS compatible async function which takes a callback as its last argument
   * @returns {Promise} A promise for the return value from the callback from the function
   */
  q.execute = function(asyncFunction){
    var defer = q.defer()
      , args = slice.call(arguments, 1);

    args.push(function(err, result){
      if(err !== null) {
        defer.reject(err);
      }
      else {
        if(arguments.length > 2){
          // Return an array if multiple success values.
          Array.prototype.shift.call(arguments, 1);
          defer.resolve(arguments);
        }
        else{
          defer.resolve(result);
        }
      }
    });
    asyncFunction.apply(this, args);
    return defer.promise;
  };
}

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

if (!q.whenCall) {
  q.whenCall = function(callback, resolvedCallback, errorCallback, progressCallback) {
    try {
      return q.when(callback(), resolvedCallback, errorCallback, progressCallback);
    } catch (err) {
      return errorCallback(err);
    }
  }
}

module.exports = q;
