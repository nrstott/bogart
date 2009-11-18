var EjsScanner = require("ejs").EjsScanner;
var EjsView = require("ejs").EjsView;
var EJS = require("ejs").EJS;
var util = require("util");
var fs = require("file");
var Request = require("jack").Request;

exports.FileSystemTemplateLocator = function(options){
    options = options || {};

    this.layoutsPath = options.layoutsPath || "layouts/";
    this.viewsPath = options.viewsPath || "/";
    this.sharedPath = options.sharedPath || "shared/";
    this.cache_views = options.cache_views || true;

    var rootPath = fs.path(system.env["BOGART_ROOT"] || fs.path(require.main).dirname()) + "/views/";
    var cache = {
        layout: {},
        shared: {},
        view: {}
    };

    var checkRelativePath = function(relativePath){
        if (relativePath == undefined || relativePath == null)
            throw new Error("Argument error, relativePath is required");
        if (relativePath[0] == "/")
            throw new Error("Expected a relative path: " + relativePath);
    };

    var ensureExtension = function(path){
        if (!path.match(/\.ejs\.html$/))
            path += ".ejs.html";
        return path;
    };

    /**
     * If the view started with 'shared/', must delegate to getSharedTemplate
     * @param relativePath Relative path to the view
     */
    this.getViewTemplate = function(relativePath){
        var rawTemplate;
        var viewFilePath;
        var template;

        checkRelativePath(relativePath);

        if (/shared\//g.test(relativePath)){
            return this.getSharedTemplate(relativePath.replace(/shared\//, ""));
        }

        viewFilePath = fs.path(rootPath + this.viewsPath + relativePath);
        viewFilePath = ensureExtension(viewFilePath);
        if (!fs.exists(viewFilePath)) {
            if (fs.exists("_" + viewFilePath)) {
                viewFilePath = "_" + viewFilePath;
            } else {
                throw new Error("File not found: " + viewFilePath);
            }
        }

        if (this.cache_views && cache.view[viewFilePath]) {
            print("returning cached " + viewFilePath);
            return cache.view[viewFilePath];
        }

        print("loading view from " + viewFilePath);
        rawTemplate = fs.read(viewFilePath, "+r");

        template = new EJS({ text: rawTemplate });
        cache.view[viewFilePath] = template;
        
        return template;
    };

    this.getLayoutTemplate = function(relativePath){
        var template;

        checkRelativePath(relativePath);

        var layoutFilePath = fs.path(rootPath + this.layoutsPath + relativePath);
        layoutFilePath = ensureExtension(layoutFilePath);
        
        if (this.cache_views && cache.layout[layoutFilePath]) {
            print("returning cached " + layoutFilePath);
            return cache.layout[layoutFilePath];
        }

        print("loading layout: " + relativePath);
        var rawTemplate = fs.read(layoutFilePath, "+r");

        template = new EJS({ text: rawTemplate });
        cache.layout[layoutFilePath] = template;

        return template;
    };

    this.getSharedTemplate = function(relativePath) {
        var sharedFilePath;
        var rawTemplate;
        var partialPath;
        var template;

        checkRelativePath(relativePath);

        sharedFilePath = fs.path(rootPath + this.sharedPath + relativePath);
        sharedFilePath = ensureExtension(sharedFilePath);
        
        if (this.cache_views && cache.shared[sharedFilePath]) {
            print("returning cached " + sharedFilePath);
            return cache.shared[sharedFilePath];
        }

        if (fs.exists(sharedFilePath)) {
            rawTemplate = fs.read(sharedFilePath, "+r");
        } else {
            partialPath = fs.join(rootPath, this.sharedPath,
                    "_" + sharedFilePath.substring(sharedFilePath.lastIndexOf("/") + 1));
            print("PARTIAL PATH: " + partialPath);
            if (fs.exists(partialPath)) {
                rawTemplate = fs.read(partialPath, "+r");
            } else {
                throw new Error("could not find template " + sharedFilePath);
            }
        }

        template = new EJS({ text: rawTemplate });
        cache.shared[sharedFilePath] = template;
        
        return template;
    };
};

/**
 * Renders a template optionally using a layout
 * @param layout Layout for the template, pass null for no layout
 * @param env JSGI environment
 * @param templateLocator Template Locator used by the partial helper to find partial templates
 * @constructor
 */
exports.EjsLayoutRenderer = function(layout, env, templateLocator) {
    var publish = function(){
        var args = Array.prototype.slice.call(arguments);
        var event = args.shift();
        var i, subscriber;

        this.subscribers[event] = this.subscribers[event] || [];
        for (i=0;i<this.subscribers[event].length;++i) {
            subscriber = this.subscribers[event][i];
            subscriber.apply({}, args);
        }
    }.bind(this);

    this.layout = layout || null;
    this.request = new Request(env);
    this.templateLocator = templateLocator;

    /**
     * Renders a template inside of the layout of the EjsLayoutRenderer.
     *
     * Raises events
     * 'before-render': Receives the viewModel, template helpers, and layout helpers as arguments
     * 'after-render': Receives a string containing the rendered template
     * 
     * @param template An EJS template
     * @param {Object} model Scope object that determines the local variables available when the template is evaluated.
     * @param {Object} options
     * @returns Evaluated template
     * @type String
     */
    this.render = function(template, model, options) {
        options = options || {};
		model = model || {};

        var self = this;
        var out;

        var contentHolders = {};
        var viewModel = new EjsView(model);

        var templateLocals = {
            script_tag: function(script) {
                return viewModel.start_tag_for("script", { src: "/js/" + script + ".js", type: "text/javascript" }) + 
                       viewModel.tag_end("script");
            },
            stylesheet_tag: function(stylesheet, htmlOptions) {
                var opts = { href: "/css/" + stylesheet + ".css", rel: "stylesheet", media: "screen" };
                util.update(opts, htmlOptions);
                return viewModel.start_tag_for("link", opts) + viewModel.tag_end("link");
            },
            content_for: function(namespace, callback) {
                if (!(callback instanceof Function))
                    throw new Error("content_for requires a function as its second argument");

                print("content for " + namespace);

                var context =   { buffer: "" };
                with (viewModel) {
                    with(model) {
                        with(this) {
                            callback = eval(callback.toSource().replace(/___ejsO/g, "this.buffer"));
                            callback.call(context);
                        }
                    }
                }

                contentHolders[namespace] = context.buffer;
            },
            partial : function(partialName, partialModel) {
                if (partialModel === undefined) {
                    partialModel = model;
                }
                if (!partialName.match(/\.ejs\.html$/g))
                    partialName = partialName + ".ejs.html";

                var isShared = false;
                if (partialName.match(/^shared\//g))
                {
                    partialName = partialName.substring(partialName.indexOf("/") + 1);
                    isShared = true;
                }

                if (partialName[0] != "_")
                    partialName = "_" + partialName;

                print("loading partial " + partialName);

                var template;
                if (isShared)
                    template = self.templateLocator.getSharedTemplate(partialName);
                else
                    template = self.templateLocator.getViewTemplate(partialName);

                return self.render(template, partialModel, {useLayout: "no" });
            },
            form_for: function(model, action, htmlOptions, callback){
                if (typeof callback != "function")
                    throw new Error("callback expected in form_for");

                var method;
                var inflector = require("inflector");

                htmlOptions = htmlOptions || {};
                method = htmlOptions.method = htmlOptions.method || "post";
                method = htmlOptions.method = htmlOptions.method.toLowerCase();

                if (htmlOptions.method == "delete" || htmlOptions.method == "put"){
                    htmlOptions.method = "post";
                }

                var tagName = function(name){
                    var prefix = htmlOptions.namespace || inflector.underscore(model.constructor.name);
                    return prefix + "[" + name + "]";
                };

                var tagId = function(name) {
                    var prefix = htmlOptions.namespace || inflector.underscore(model.constructor.name);
                    return prefix + "_" + name;
                };

                var setHtmlOptions = function(name, htmlOptions){
                    htmlOptions = htmlOptions || {};
                    htmlOptions.id = htmlOptions.id || tagId(name);
                    return htmlOptions;
                };

                var formHelper = {
                    check_box: function(name, htmlOptions, checkedValue, uncheckedValue) {
                        var html;

                        checkedValue = checkedValue || 1;
                        uncheckedValue = uncheckedValue || 0;

                        setHtmlOptions(name, htmlOptions);
                        if (model[name]) {
                            htmlOptions.checked = "checked";
                        }

                        html = viewModel.input_field_tag(tagName(name), checkedValue, "checkbox", htmlOptions);
                        html += viewModel.hidden_field_tag(tagName(name), uncheckedValue, { id: htmlOptions.id });

                        return html;
                    },
                    select: function(name, choices, htmlOptions){
                        setHtmlOptions(name, htmlOptions);
                        return viewModel.select_tag(tagName(name), model[name] || "", choices, htmlOptions);
                    },
                    submit: function(text) {
                        return viewModel.submit_tag(text || "Submit");
                    }
                };

                ["text_field","text_area","hidden_field","password_field"].forEach(function(helper){
                    formHelper[helper] = function(name, htmlOptions){
                        htmlOptions = setHtmlOptions(name, htmlOptions);
                        return viewModel[helper + "_tag"](tagName(name), model[name] || "", htmlOptions);
                    };
                });

                ___ejsO += viewModel.form_tag(action, htmlOptions);

                // Add RESTful hidden field helper for 'delete' and 'put' methods
                if (method.toLowerCase() == "delete" || method.toLowerCase() == "put"){
                    ___ejsO += viewModel.hidden_field_tag("_method", method);
                }

                callback(formHelper);

                ___ejsO += "</form>";

                return ___ejsO;
            }
        };

        var layoutLocals = {
            hold: function(namespace) {
                if (namespace)
                    return contentHolders[namespace];
                return out;
            }
        };

        if (env["jsgi.session"] != undefined) {
            templateLocals.flash = env["jsgi.session"].flash || {};
        }

        publish("before-render", viewModel, templateLocals, layoutLocals);

        util.update(layoutLocals, templateLocals);

        with (viewModel) {
            with (model) {
                with (templateLocals) {
                    out = eval(template.out());
                }

                if (options.useLayout == "no") {
                    publish("after-render", out);
                    return out;
                }

                with (layoutLocals) {
                    if (options.layout) {
                        out = eval(options.layout.out());
                    } else{
                        out = eval(layout.out());
                    }

                    publish("after-render", out);
                    return out;
                }
            }
        }
    };
};

exports.EjsLayoutRenderer.prototype.subscribers = {};

exports.EjsLayoutRenderer.prototype.subscribeTo = function(event, callback) {
    this.subscribers[event] = this.subscribers[event] || [];
    this.subscribers[event].push(callback);
};
