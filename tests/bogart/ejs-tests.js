var EJS = require("ejs").EJS;
var assert = require("test/assert");
var EjsLayoutRenderer = require("bogart/plugin/ejs/ejs_layout_renderer").EjsLayoutRenderer;
var MockRequest = require("jack/mock").MockRequest;
var simpleLayout;
var layoutEJS;

exports.setup = function() {
    simpleLayout = "<html><body><%= hold() %></body></html>";
    layoutEJS = new EJS({text:simpleLayout});
};

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
    var view = "<% form_for({ hello: 'world' }, '/', { method: 'put' }, function(f) { %><div>" +
               "<%= f.submit('Press Me') %>" +
               "</div><% }) %>";

    var viewEJS = new EJS({text:view});
    var layoutRenderer = new EjsLayoutRenderer(new EJS({ text: simpleLayout }), {});

    var result = layoutRenderer.render(viewEJS);

    assert.isTrue(/<input type=['"]submit['"]\s*value=['"]Press Me['"]\s*\/>/.test(result), result);
};

exports["test renders without layout"] = function() {
    var view = "<h1>Hello World</h1>";
    var layout = "<html><body><%= hold() %></body></html>";

    var viewEJS = new EJS({text:view});
    var layoutEJS = new EJS({text:layout});
    var layoutRenderer = new EjsLayoutRenderer(layoutEJS, {});

    var result = layoutRenderer.render(viewEJS, {}, { useLayout: "no" });

    assert.isEqual(view, result, "Did not match expected view: " + result);
};

exports["test renders partial"] = function() {
    var view = "<h1><%= partial('test_partial') %></h1>";
    var partial = "hello";
    var layout = simpleLayout;

    var viewEJS = new EJS({ text: view });
    var layoutEJS = new EJS({ text: layout });
    var layoutRenderer = new EjsLayoutRenderer(layoutEJS, {
        getViewTemplate: function() { return new EJS({text:partial}); }
    });

    var result = layoutRenderer.render(viewEJS, {});

    assert.isEqual("<html><body><h1>hello</h1></body></html>", result);
};


exports["test model variable is available in view"] = function() {
    // Arrange
    var name = "Bob";
    var view = "<h1><%= name %></h1>";
    var viewEJS = new EJS({ text: view });
    var layoutRenderer = new EjsLayoutRenderer(layoutEJS, {});

    // Act
    var result = layoutRenderer.render(viewEJS, { name: name });

    // Assert
    assert.isEqual(simpleLayout.replace("<%= hold() %>", view.replace("<%= name %>", name)), result);
};

exports["test pass model to partial"] = function() {
    // Arrange
    var name = "Bob";
    var view = "<%= partial('header', { name: name }) %>";
    var partial = "<h1><%= name %></h1>";
    var viewEJS = new EJS({text: view});

    var layoutRenderer = new EjsLayoutRenderer(layoutEJS, {
        getViewTemplate: function() {
            return new EJS({text: partial});
        }
    });

    // Act
    var result = layoutRenderer.render(viewEJS, { name: name });

    // Assert
    assert.isEqual(simpleLayout.replace("<%= hold() %>", partial.replace("<%= name %>", name)), result);
};

exports["test pass model to forms helper inside of partial"] = function() {
    // Arrange
    var name = "Bob";
    var view = "<%= partial('header', { model: model, name: name }) %>";
    var partial = "<% form_for(model, '/person', {}, function(f) { %>" +
            "<%= f.submit(name) %>" +
            "<% }); %>";
    var viewEJS = new EJS({ text: view });

    var layoutRenderer = new EjsLayoutRenderer(layoutEJS, {
        getViewTemplate: function() { return new EJS({text: partial}); }
    });

    // Act
    var result = layoutRenderer.render(viewEJS, { name: name, model: new Person() });

    // Assert
    assert.isTrue(result.indexOf(name) !== -1, "Should contain '" + name + "'");
};

function Person() {
    this.firstName = "Sam";
    this.LastName = "Smith";
}
