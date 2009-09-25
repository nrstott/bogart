var EJS = require("ejs").EJS;
var assert = require("test/assert");
var EjsLayoutRenderer = require("../../lib/bogart-ejs").EjsLayoutRenderer;
var MockRequest = require("jack/mock").MockRequest;

exports.testRenderLayout = function() {
    var layout = "<html><body><%= hold() %></body></html>";
    var view = "<span>Nathan</span>";

    var viewEJS = new EJS({text: view});
    var layoutRenderer = new EjsLayoutRenderer(new EJS({text: layout}), MockRequest.envFor(null, "", {}));

    var result = layoutRenderer.render(viewEJS);
    assert.isEqual("<html><body><span>Nathan</span></body></html>", result);
};

exports.testContentFor = function(){
    var layout = "<html><head><%= hold('end_of_head') %></head><body><%= hold() %></body></html>";
    var view = "<% content_for('end_of_head', function() { %><title>Hello</title><% }); %>World";

    var viewEJS = new EJS({text:view});
    var layoutRenderer = new EjsLayoutRenderer(new EJS({text: layout}), MockRequest.envFor(null, "", {}));

    var result = layoutRenderer.render(viewEJS);

    assert.isEqual("<html><head><title>Hello</title></head><body>World</body></html>", result);
};

exports["test form_for with put method renders hidden field _method"] = function() {
    var layout = "<html><body><%= hold() %></body></html>";
    var view = "<span>test</span>" +
               "<% form_for({ hello: 'word' }, '/', { method: 'put' }, function(f) {}) %>";

    var viewEJS = new EJS({text:view});
    var layoutRenderer = new EjsLayoutRenderer(new EJS({text: layout}), MockRequest.envFor(null, "", {}));

    var result = layoutRenderer.render(viewEJS);

    assert.isTrue(/<input id=['"]_method['"] value=['"]put['"] type=['"]hidden['"] name=['"]_method['"] \/>/g.test(result), result);
};