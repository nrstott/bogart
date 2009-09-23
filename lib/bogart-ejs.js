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

    var rootPath = fs.path(system.env["BOGART_ROOT"] || require.main.dirname()) + "/views/";

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
        checkRelativePath(relativePath);

        if (/shared\//g.test(relativePath)){
            return this.getSharedTemplate(relativePath.replace(/shared\//, ""));
        }

        var viewFilePath = fs.path(rootPath + this.viewsPath + relativePath);
        viewFilePath = ensureExtension(viewFilePath);

        print("loading view from " + viewFilePath);
        var rawTemplate = fs.read(viewFilePath, "+r");

        return new EJS({ text: rawTemplate });
    };

    this.getLayoutTemplate = function(relativePath){
        print("loading layout: " + relativePath);
        checkRelativePath(relativePath);

        var layoutFilePath = fs.path(rootPath + this.layoutsPath + relativePath);
        layoutFilePath = ensureExtension(layoutFilePath);
        
        var rawTemplate = fs.read(layoutFilePath, "+r");

        return new EJS({ text: rawTemplate });
    };

    this.getSharedTemplate = function(relativePath) {
        checkRelativePath(relativePath);

        var sharedFilePath = fs.path(rootPath + this.sharedPath + relativePath);
        sharedFilePath = ensureExtension(sharedFilePath);

        var rawTemplate = fs.read(sharedFilePath, "+r");

        return new EJS({ text: rawTemplate });
    };
};

exports.EjsLayoutRenderer = function(layout, env, templateLocator) {
    this.layout = layout || null;
    this.request = new Request(env);
    this.templateLocator = templateLocator;

    this.render = function(template, model, options) {
        options = options || {};
		model = model || {};

        var self = this;

        var contentHolders = {};
        var viewModel = new EjsView(model);

        var templateLocals = {
            script_tag: function(script) {
                return viewModel.start_tag_for("script", { src: "/public/js/" + script + ".js", type: "text/javascript" }) + viewModel.tag_end("script");
            },
            stylesheet_tag: function(stylesheet, htmlOptions) {
                var opts = { href: "/public/css/" + stylesheet + ".css", rel: "stylesheet", media: "screen" };
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
            partial : function(partialName) {
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

                return self.render(template, model, {useLayout: "no" });
            },
            form_for: function(model, action, htmlOptions, callback){
                if (typeof callback != "function")
                    throw new Error("callback expected in form_for");

                htmlOptions = htmlOptions || {};
                htmlOptions.action = action;

                var inflector = require("inflector");

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
                    select: function(name, choices, htmlOptions){
                        setHtmlOptions(name, htmlOptions);
                        return viewModel.select_tag(tagName(name), model[name] || "", choices, htmlOptions);
                    }
                };

                ["text_field","text_area","hidden_field"].forEach(function(helper){
                    formHelper[helper] = function(name, htmlOptions){
                        htmlOptions = setHtmlOptions(name, htmlOptions);
                        return viewModel[helper + "_tag"](tagName(name), model[name] || "", htmlOptions);
                    };
                });

                ___ejsO += viewModel.form_tag(action, htmlOptions);

                callback(formHelper);

                ___ejsO += "</form>";
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

        util.update(layoutLocals, templateLocals);

        var out;

        with (viewModel) {
            with (model) {
                with (templateLocals) {
                    out = eval(template.out());
                }

                if (options.useLayout == "no") {
                    return out;
                }

                with (layoutLocals) {
                    if (options.layout)
                        return eval(options.layout.out());
                    return eval(layout.out());
                }
            }
        }
    };
};
