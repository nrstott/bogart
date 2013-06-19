var q = require('../q')
  , merge = require('../util').merge;

module.exports = function (responseDefaults, nextApp) {
  if (nextApp === undefined) {
    nextApp = responseDefaults;
    responseDefaults = {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    };
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