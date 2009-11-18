var EJS = require("ejs").EJS;
var assert = require("test/assert");
var EjsLayoutRenderer = require("bogart/plugin/ejs/ejs_layout_renderer").EjsLayoutRenderer;
var MockRequest = require("jack/mock").MockRequest;
var simpleLayout = "<html><body><%= hold() %></body></html>";

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

exports["test form_for should render action attribute"] = function() {
    var view = "<% form_for({ hello: 'world' }, '/test', {}, function(f) {}) %>";

    var viewEJS = new EJS({text:view});
    var layoutRenderer = new EjsLayoutRenderer(new EJS({text: simpleLayout}), MockRequest.envFor(null, "", {}));

    var result = layoutRenderer.render(viewEJS);

    assert.isTrue(/<form\s.*action=['"]\/test['"]\s.*>/.test(result), result);
};

exports["test form_for with put method renders hidden field _method"] = function() {
    var view = "<% form_for({ hello: 'world' }, '/', { method: 'put' }, function(f) {}) %>";

    var viewEJS = new EJS({text:view});
    var layoutRenderer = new EjsLayoutRenderer(new EJS({text: simpleLayout}), MockRequest.envFor(null, "", {}));

    var result = layoutRenderer.render(viewEJS);

    assert.isTrue(/<input id=['"]_method['"] type=['"]hidden['"] name=['"]_method['"] value=['"]put['"] \/>/g.test(result), result);
    assert.isTrue(/<form.*method=['"]post['"].*\/>/.test(result), result);
};

exports["test form helper submit tag"] = function() {
    var view = "<% form_for({ hello: 'world' }, '/', { method: 'put' }, function(f) { %>" +
               "<%= f.submit('Press Me') %>" +
               "<% }) %>";

    var viewEJS = new EJS({text:view});
    var layoutRenderer = new EjsLayoutRenderer(new EJS({ text: simpleLayout }), MockRequest.envFor(null, "", {}));

    var result = layoutRenderer.render(viewEJS);

    assert.isTrue(/<input type=['"]submit['"]\s*value=['"]Press Me['"]\s*\/>/.test(result), result);
};

