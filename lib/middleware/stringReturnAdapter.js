var q = require('../q')
  , merge = require('../util').merge;

module.exports = function stringReturnAdapter(responseDefaults, nextApp) {
  if (nextApp === undefined) {
    if (typeof responseDefaults === 'function') {
      nextApp = responseDefaults;
      responseDefaults = {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      };
    } else {
      return function (nextApp) {
        return stringReturnAdapter(responseDefaults, nextApp);
      };
    }
  }

  return function (req) {
    return q.when(nextApp(req), function (resp) {
      if (typeof resp === 'string') {
        return merge({}, responseDefaults, { body: [ resp ] });
      }

      return resp;
    });
  };
};