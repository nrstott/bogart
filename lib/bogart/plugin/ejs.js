var util = require("util");
var fs = require("file");
var FileSystemTemplateLocator = exports.FileSystemTemplateLocator =
                                require("./ejs/ejs_layout_renderer").FileSystemTemplateLocator;
var EjsLayoutRenderer = exports.EjsLayoutRenderer =
                        require("./ejs/ejs_layout_renderer").EjsLayoutRenderer;
var templateLocators = {};
var getTemplateLocator = function(config) {
    if (typeof templateLocators[config.viewsPath] === "undefined") {
        print("Instantiating locator for '" + config.viewsPath + "'");
        templateLocators[config.viewsPath] = new FileSystemTemplateLocator(config);
    }
    return templateLocators[config.viewsPath];
};

/**
 * Plugin providing EJS support
 *
 * Events:
 * 'after_render': callback receives one argument, the raw text that has been rendered
 * 'before_write_response': callback receives two arguments, the response and the raw text that will be written to it
 * 'after_write_response': callback receives one argument, the response
 */
var Ejs = exports.Ejs = function(options) {
    var self = this;
    var view_home;
    var templateLocatorConfig = {};

    options = options || {};
    view_home = options.home_dir || "views";
    templateLocatorConfig.viewsPath = options.viewsPath || "";

    this.name = "Ejs";

    this.cache_views = options.cache_views === undefined ? true : options.cache_views;

    this.callbacks = {
        before_execute_route: function(app, routeHandlerContext) {
            var config = util.copy(templateLocatorConfig);
            if (app.viewsPath) {
                if (fs.isRelative(app.viewsPath)) {
                    config.viewsPath = fs.join(view_home, app.viewsPath);
                    config.layoutsPath = fs.join(view_home, "layouts");
                    config.sharedPath = fs.join(view_home, "shared");
                } else {
                    config.viewsPath = app.viewsPath;
                    config.layoutsPath = fs.join(app.viewsPath, "layouts");
                    config.sharedPath = fs.join(app.viewsPath, "shared");
                }
                config.cache_views = self.cache_views;
            }
            var templateLocator = getTemplateLocator(config);
            var layoutPath = app.layout || null;
            
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
                var canPublish = typeof routeHandlerContext.publish === "function";
                var before_render = function(sender, viewModel) {
                    routeHandlerContext.publish("before_render", routeHandlerContext, viewModel);
                };

                model = model || {};
                options = options || {};

                var viewTemplate = templateLocator.getViewTemplate(viewName);
                var layoutTemplate = null;

                if (routeHandlerContext.layout() !== null && routeHandlerContext.layout !== "") {
                    layoutTemplate = templateLocator.getLayoutTemplate(routeHandlerContext.layout());
                }

                var renderer = new EjsLayoutRenderer(layoutTemplate, templateLocator);

                if (canPublish) {
                    EjsLayoutRenderer.prototype.subscribeTo("before_render", before_render);
                }

                if (layoutTemplate === null) {
                    renderOptions.useLayout = "no";
                } else {
                    if (options.useLayout === "no") {
                        renderOptions.useLayout = options.useLayout;
                    }
                }

                var page = renderer.render(viewTemplate, model, renderOptions);
                self.publish(Ejs.Event.AFTER_RENDER, page);

                self.publish(Ejs.Event.BEFORE_WRITE_RESPONSE, routeHandlerContext.response, page);
                routeHandlerContext.response.write(page);
                self.publish(Ejs.Event.AFTER_WRITE_RESPONSE, routeHandlerContext.response);

                if (canPublish) {
                    EjsLayoutRenderer.prototype.unsubscribe(before_render);
                }

                return routeHandlerContext.response.finish();
            };
        }
    };
};

Ejs.Event = {
    AFTER_RENDER: "after_render",
    BEFORE_WRITE_RESPONSE: "before_write_response",
    AFTER_WRITE_RESPONSE: "after_write_response"
};

require("observable").mixin(Ejs.prototype);
Ejs.subscribeTo = Ejs.subscribeTo;
Ejs.unsubscribe = Ejs.unsubscribe;
