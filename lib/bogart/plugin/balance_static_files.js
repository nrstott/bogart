
/**
 * Attach to before-render to balance static files across an array of domains
 *
 * Balance Static Files (add the following to your application configuration module):
 * require("bogart-ejs").EjsLayoutRenderer.prototype.subscribeTo("before-render", 
 *     require("bogart").BalanceStaticFiles(["assets0.local.dev","assets1.local.dev"]));
 *
 * @param {Array} domains Array of domains
 * @constructor
 */
var BalanceStaticFiles = exports.BalanceStaticFiles = function(domains) {
    if (domains === undefined || domains.length === 0) {
        return function() {};
    }

    domains = domains.map(function(domain) {
        if (!/^https?:\/\//.test(domain)) {
            return "http://" + domain;
        }
        return domain;        
    });

    return function(viewModel, templateHelpers, layoutHelpers) {
        var index = 0;
        var getNext = function() {
            var rv = domains[index];
            index += 1;
            if (index >= domains.length) {
                index = 0;
            }
            return rv;
        };
        var oldImageHelper = viewModel.img_tag;
        var oldScriptHelper = templateHelpers.script_tag;
        var oldStylesheetHelper = templateHelpers.stylesheet_tag;
        
        viewModel.img_tag = function(imageLocation, alt, options) {
            imageLocation = getNext() + imageLocation;
            return oldImageHelper(imageLocation, alt, options);
        };

        templateHelpers.script_tag = function(scriptLocation) {
            var tag = oldScriptHelper(scriptLocation);
            tag = tag.replace(/(src=['"])([^'"]*)/, encodeURI("$1" + getNext() + "$2"));
            return tag;
        };

        templateHelpers.stylesheet_tag = function(stylesheetLocation, htmlOptions) {
            var tag = oldStylesheetHelper(stylesheetLocation, htmlOptions);
            tag = tag.replace(/(href=['"])([^'"]*)/, encodeURI("$1" + getNext() + "$2"));
            return tag;
        };
    };
};

