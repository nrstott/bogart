var EJS = require("ejs").EJS;
var assert = require("test/assert");
var EjsLayoutRenderer = require("../../lib/bogart-ejs").EjsLayoutRenderer;

exports.testRenderLayout = function() {
    var layout = "<html><body><%= hold() %></body></html>";
    var view = "<span>Nathan</span>";

    var viewEJS = new EJS({text: view});
    var layoutRenderer = new EjsLayoutRenderer(new EJS({text: layout}));

    var result = layoutRenderer.render(viewEJS);
    assert.isEqual("<html><body><span>Nathan</span></body></html>", result);
};