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
    var indexRun = false;

    var resource = new Bogart.Resource("tasks", function(){
        this.GET("/", function() {
            indexRun = true;
            return this.response.finish();
        });
    });

    var env = MockRequest.envFor("get", "/tasks", {});

    resource.start(env);

    assert.isTrue(indexRun, "Index route should have handled request");
};