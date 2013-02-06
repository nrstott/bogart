
var util = require('./util');

module.exports = function(router, jsgiReq) {
  return Object.create(jsgiReq, {
    router: { value: router },
    search: {
      get: function() {
        return util.extractSearch(jsgiReq);
      }
    },
    isXMLHttpRequest: {
      get: function() {
        return !util.no(this.headers['x-requested-with']);
      }
    },
    routeParams: {
      value: {},
      enumerable: true
    },
    params: {
      get: function() {
        return util.merge({}, this.routeParams, this.search, this.body);
      }
    }
  });
};