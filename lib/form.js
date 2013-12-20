var q = require('./q')
  , fs = require('fs')
  , path = require('path')
  , ViewEngine = require('./view').viewEngine;

function Form(validationOptions) {
  var selector = 'form'
    , viewEngine;

  var form = function (next) {
    return function (req) {
      return next(req);
    };
  };

  form.viewEngine = function (val) {
    if (val) {
      viewEngine = viewEnginePlugin(val);
      return this;
    }

    if (viewEngine === undefined) {
      viewEngine = ViewEngine('mustache');
    }

    return viewEngine;
  };

  form.selector = function (val) {
    if (val) {
      selector = val;
      return this;
    }

    return selector;
  };

  return form;
}

Form.prototype.selector = function (val) {
  if (val) {
    this._selector = val;
    return this;
  }

  return this._selector;
};

/*
 * Private Helpers
 */

var formwardenScript;

function getFormwardenScript() {
  if (formwardenScript === undefined) {
    formwardenScript = readFormwardenScript();
  }

  return formwardenScript;
}

function readFormwardenScript() {
  var filepath = path.join(__dirname, '..', 'node_modules',
        'form-warden', 'formwarden.js');

  return fs.readFileSync(filepath);
}

/*
 * Adds the form warden script on key `opts.locals.formwardenScript`
 * in the `viewEngine.render` options.
 *
 * @param {ViewEngine} viewEngine  Bogart viewEngine
 * @returns {ViewEngine}
 */
function viewEnginePlugin(viewEngine) {
  viewEngine.on('beforeRender', function (viewEngine, opts) {
    opts = opts || {};
    opts.locals = opts.locals || {};

    var formwardenScript = getFormwardenScript();

    opts.locals.formwardenScript = getFormwardenScript();
  });

  return viewEngine;
}

module.exports = Form;
