var Bogart = require("bogart");
var assert = require("test/assert");
var MockRequest = require("jack/mock").MockRequest;

exports.testIsInstanceOfResource = function(){
    assert.isTrue(new Bogart.Router("test") instanceof Bogart.Router, "Resource should be an instance of Bogart.Resource");
};

exports.testConstructorIsResource = function() {
    var ctor = new Bogart.Router("test").constructor;
    assert.isEqual(ctor, Bogart.Router, "ctor for Resource should be Resource, was '" + ctor + "'");
};

exports.testGetResourceWithParameter = function() {
    var routeHandled = false;

    var resource = new Bogart.Router(function() {
        this.GET("/:id", function() {
            routeHandled = true;
            return this.response.finish();
        });
    });

    var base = new Bogart.App();
    base.addResource("/tasks", resource);

    var env = MockRequest.envFor("get", "/tasks/1", {});

    base.run(env);

    assert.isTrue(routeHandled, "Route should have been handled");
};

exports.testBaseDelegatingToResource = function() {
    var routeHandled = false;

    var resource = new Bogart.Router(function() {
        this.GET("/", function() { routeHandled = true; return this.response.finish(); });
    });

    var env = MockRequest.envFor("get", "/tasks", {});

    var base = new Bogart.App();
    base.addResource("/tasks", resource);
    base.run(env);

    assert.isTrue(routeHandled, "Base should have delegated to resource to handle route");
};

exports.testResourceWithParameterInPath = function() {
    var routeHandled = false;
    var params = null;

    var resource = new Bogart.Router(function() {
        this.GET("/", function() {
            routeHandled = true;
            params = this.params;
            return this.response.finish();
        });
    });

    var env = MockRequest.envFor("get", "/tasks.json", {});
    
    var base = new Bogart.App();
    base.addResource("/tasks.:format", resource);
    base.run(env);

    assert.isTrue(routeHandled, "Base should have delegated to resource to handle route");
    assert.isTrue(params && params["format"] == "json");
};

exports.testResourceWithParameterInPathAndInResource = function() {
    var routeHandled = false;
    var params = null;

    var resource = new Bogart.Router(function() {
        this.GET("/:id", function() {
            routeHandled = true;
            params = this.params;
            return this.response.finish();
        });
    });

    var env = MockRequest.envFor("get", "/tasks.json/1");

    var base = new Bogart.App();
    base.addResource("/tasks.:format", resource);
    base.run(env);

    assert.isTrue(routeHandled, "Base should have delegated to resource to handle route");
    assert.isTrue(params && params["format"] == "json" && params["id"] == "1");
};