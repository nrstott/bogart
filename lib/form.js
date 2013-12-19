var q = require('./q')
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
      viewEngine = viewEngineMixin(val);
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

function viewEngineMixin(viewEngine) {
  viewEngine.on('beforeRender', function (viewEngine, opts) {
    opts = opts || {};
    opts.locals = opts.locals || {};

    opts.locals.formswardenScript = 'formswarden script stuff';
  });

  return viewEngine;
}


Form.prototype.selector = function (val) {
  if (val) {
    this._selector = val;
    return this;
  }

  return this._selector;
};

module.exports = Form;
