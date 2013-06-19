var q = require('../q');

module.exports = function (conditional, appTrue, appFalse) {
  return function (req) {
    return q.when(conditional, function (conditional) {
      if (typeof conditional === 'function') {
        conditional = conditional(req);
      }

      return conditional ? appTrue(req) : appFalse(req);
    });
  }
};