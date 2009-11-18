var FileSystemTemplateLocator = require("./ejs/ejs_layout_renderer").FileSystemTemplateLocator;
var templateLocators = {};
var getTemplateLocator = function(config) {
    if (typeof this.templateLocators[config.viewsPath] === "undefined") {
        print("Instantiating locator for '" + config.viewsPath + "'");
        templateLocators[config.viewsPath] = new FileSystemTemplateLocator(config);
    }
    return templateLocators[config.viewsPath];
};

/**
 * Plugin providing EJS support
 */
var Ejs = exports.Ejs = function(options) {
    var cache_views;
    var templateLocatorConfig = {};

    options = options || {};
    cache_views = options.cache_views || true;
    templateLocatorConfig.viewsPath = options.viewsPath || "";

    this.name = "Ejs";

    this.callbacks = {
        before_execute_route: function(app, routeHandlerContext) {
            routeHandlerContext.layout = function(path) {
                if (path !== undefined) {
                    layoutPath = path;
                }
                return layoutPath;
            };

            /**
             * Render an EJS template to an HTTP Response
             * @param viewName Name of view to render
             * @param model Model to be used for local variables when evaluating the template
             * @returns JSGI conformant HTTP response
             * @type Object
             */
            routeHandlerContext.ejs = function(viewName, model, options){
                var renderOptions = {};

                model = model || {};
                options = options || {};

                var viewTemplate = this.templateLocator.getViewTemplate(viewName);
                var layoutTemplate = null;

                if (this.layout() !== null && this.layout !== "") {
                    layoutTemplate = this.templateLocator.getLayoutTemplate(this.layout());
                }

                var EjsLayoutRenderer = require("./ejs/ejs_layout_renderer").EjsLayoutRenderer;
                var renderer = new EjsLayoutRenderer(layoutTemplate, this.env, this.templateLocator);
                if (layoutTemplate === null) {
                    renderOptions.useLayout = "no";
                } else {
                    if (options.useLayout === "no") {
                        renderOptions.useLayout = options.useLayout;
                    }
                }
                var page = renderer.render(viewTemplate, model, renderOptions);

                this.response.write(page);
                return this.response.finish();
            };
        }
    };
};
