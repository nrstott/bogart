
var util = require('./util');

module.exports = function(jsgiReq) {
  return Object.create(jsgiReq, {
    search: getter(function() {
      return util.extractSearch(jsgiReq);
    }),
    isXMLHttpRequest: getter(function() {
      return !util.no(this.headers['x-requested-with']);
    }),
    routeParams: {
      value: {},
      enumerable: true
    },
    params: getter(function() {
      return util.merge({}, this.routeParams, this.search, this.body);
    })
  });
};

/**
 * Helper function to create property descriptor that is enumerable
 * and has a getter.
 *
 * @param fn {Function}  The getter function.
 * @api private
 */
function getter(fn) {
  return {
    get: fn,
    enumerable: true
  }
}
