var EjsScanner = require("ejs").EjsScanner;

exports.EjsLayoutRenderer = function(layout) {
    this.render = function(template){
        var contentHolders = {};

        var templateLocals = {
            contentFor: function(namespace, callback) {
                callback = eval(callback.toSource().replace("___ejsO +=", "return "));
                contentHolders[namespace] = callback();
            }
        };

        var out;
        with (templateLocals) {
            out = eval(template.out());
        }

        var layoutLocals = {
            hold: function(namespace) {
                if (namespace)
                    return contentHolders[namespace];
                return out;
            }
        };

        with (layoutLocals) {
            return eval(layout.out());
        }
    };
};