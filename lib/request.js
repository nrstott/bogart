
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
    }
  });
};