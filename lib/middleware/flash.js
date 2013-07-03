var q = require('../q')
  , when = q.when
  , flashIdCookieProvider = require("../flash/flashIdCookieProvider")
  , flashCookieDataProvider = require("../flash/flashCookieDataProvider");

module.exports = function flash(config, nextApp) {
  if (nextApp === undefined) {
    if (typeof config === 'function') {
      nextApp = config;
      config = {};
    } else {
      return function (nextApp) {
        return flash(config, nextApp);
      };
    }
  }

  if (typeof nextApp !== 'function') {
    throw {
      message: 'flash middleware expects a nextApp as the last argument.',
      code: 'BOGART_FLASH_BAD_NEXTAPP'
    };
  }

  config = config || {};
  config.options = config.options || {};

  config.flashIdProvider = config.flashIdProvider || new flashIdCookieProvider(config.options.idProvider || {});
  config.flashDataProvider = config.flashDataProvider || new flashCookieDataProvider(config.options.dataProvider || {});

  return function (req) {
    if (req.pathInfo === '/favicon.ico') {
      return nextApp(req);
    }
    var oldFlashId = config.flashIdProvider.getFlashId(req);

    // get a new id for the current request
    var newFlashId = config.flashIdProvider.newId(req);

    // make flash data from previous request available
    req.env = req.env || {};
    var prevData = oldFlashId ? config.flashDataProvider.previousFlash(req, oldFlashId) : {};

    return when(prevData, function (data) {
      req.env.flash = data || {};
      // create the setter for new flash data
      var setter = config.flashDataProvider.setter(req, newFlashId);
      req.flash = function (key, val) {
        if (key && val) {
          var obj = {};
          obj[key] = val;
          setter(obj);
        } else return req.env.flash[key];
      }

      return when(nextApp(req), function (resp) {
        if (oldFlashId) {
          // clear old flash data
          resp = config.flashDataProvider.clear(req, resp, oldFlashId);
          // clear old flash id
          resp = config.flashIdProvider.clear(req, resp, oldFlashId);
        }

        // finalize the flashId provider for the current request
        resp = config.flashIdProvider.finalize(req, resp, newFlashId);
        // finalize the flash data provider for the current request
        resp = config.flashDataProvider.finalize(req, resp, newFlashId);

        return resp;
      });
    });
  };
};