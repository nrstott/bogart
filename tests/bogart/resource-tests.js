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

[{ name: "Undefined", value: undefined }, { name: "Null", value: null },
    {name: "Empty", value: "" }, { name: "Slash", value: "" }].forEach(function(testCase) {
    var testName = "testConstructingWith" + testCase.name + "RaisesError";
    exports[testName] = function() {
        var errorCaught = false;
        try {
            new Bogart.Resource(testCase.value);
        } catch (err){
            errorCaught = true;
        }

        assert.isTrue(errorCaught, "Creating an unnamed resource should raise an exception");
    };
});

exports.testGetResourceIndex = function() {
    var routeHandled = false;

    var resource = new Bogart.Resource("tasks", function(){
        this.GET("/", function() {
            routeHandled = true;
            return this.response.finish();
        });
    });

    var env = MockRequest.envFor("get", "/tasks", {});

    resource.start(env);

    assert.isTrue(routeHandled, "Index route should have handled request");
};

exports.testGetResourceWithParameter = function() {
    var routeHandled = false;

    var resource = new Bogart.Resource("tasks", function() {
        this.GET("/:id", function() {
            routeHandled = true;
            return this.response.finish();
        });
    });

    var env = MockRequest.envFor("get", "/tasks/1", {});
    resource.start(env);

    assert.isTrue(routeHandled, "Route should have been handled");
};

exports.testBaseDelegatingToResource = function() {
    var routeHandled = false;

    var base = new Bogart.Base();

    var resource = new Bogart.Resource("tasks", function() {
        this.GET("/", function() { routeHandled = true; return this.response.finish(); });
    });

    base.addResource(resource);

    var env = MockRequest.envFor("get", "/tasks", {});

    base.start(env);

    assert.isTrue(routeHandled, "Base should have delegated to resource to handle route");
};