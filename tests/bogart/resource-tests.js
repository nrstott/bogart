var Bogart = require("bogart");
var assert = require("test/assert");
var MockRequest = require("jack/mock").MockRequest;

exports.testIsInstanceOfResource = function(){
    assert.isTrue(new Bogart.Resource("test") instanceof Bogart.Resource, "Resource should be an instance of Bogart.Resource");
};

exports.testConstructorIsResource = function() {
    var ctor = new Bogart.Resource("test").constructor;
    assert.isEqual(ctor, Bogart.Resource, "ctor for Resource should be Resource, was '" + ctor + "'");
};

exports.testGetResourceWithParameter = function() {
    var routeHandled = false;

    var resource = new Bogart.Resource(function() {
        this.GET("/:id", function() {
            routeHandled = true;
            return this.response.finish();
        });
    });

    var base = new Bogart.Base();
    base.addResource("/tasks", resource);

    var env = MockRequest.envFor("get", "/tasks/1", {});

    base.start(env);

    assert.isTrue(routeHandled, "Route should have been handled");
};

exports.testBaseDelegatingToResource = function() {
    var routeHandled = false;

    var resource = new Bogart.Resource(function() {
        this.GET("/", function() { routeHandled = true; return this.response.finish(); });
    });

    var base = new Bogart.Base();
    base.addResource("/tasks", resource);

    var env = MockRequest.envFor("get", "/tasks", {});

    base.start(env);

    assert.isTrue(routeHandled, "Base should have delegated to resource to handle route");
};