var assert = require("test/assert");
var bogart = require("bogart");
var MockRequest = require("jack/mock").MockRequest

assert.isFalse(typeof bogart.Bogart.Base == "undefined", "Bogart.Base should not be undefined");

var indexPageCount = 0;

exports.testGetRoute = function() {

    get("/", function() {
        indexPageCount += 1;
        this.response.write("the index page");
        return this.response.finish();
    });
    
    var env = MockRequest.envFor("get", "/", {});
    var val = bogart.app(env);
    assert.isTrue(indexPageCount == 1, "IndexPage function should've been called '1' time, was called '" + indexPageCount + "' times");
};

exports.testNoConflict = function() {
    Bogart.noConflict();

    assert.isTrue(typeof get == "undefined", "Get should be undefined");
    assert.isTrue(typeof route == "undefined", "Route should be undefined");
};

if (require.main == module.id)
    require("test/runner").run(exports);