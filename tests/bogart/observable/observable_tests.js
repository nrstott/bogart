var assert = require("test/assert");
var observable = require("bogart/observable");
var Observable = observable.Observable;
var ObservableWithPlugins = observable.ObservableWithPlugins;

exports["test publish"] = function() {
    var obj = new Observable();
    obj.publish("test");
};

exports["test subscribeTo an event"] = function() {
    var callbackCalled = false;
    var obj = new Observable();

    obj.subscribeTo("hello", function() { callbackCalled = true; });
    obj.publish("hello");

    assert.isTrue(callbackCalled);
};

exports["test two observables do not share events"] = function() {
    var aCalled = false;

    var a = function() { aCalled = true; };

    var obs1 = new Observable();
    var obs2 = new Observable();

    obs1.subscribeTo("a", a);
    obs2.publish("a");

    assert.isFalse(aCalled);

    obs1.publish("a");

    assert.isTrue(aCalled);
};

exports["test addPlugin"] = function() {
    var obs = new ObservableWithPlugins();
    obs.addPlugin({});

    assert.isEqual(1, obs.plugins.length);
};

exports["test removePlugin"] = function() {
    var plugin = {};

    var obs = new ObservableWithPlugins({ plugins: [plugin] });
    obs.removePlugin(plugin);

    assert.isEqual(0, obs.plugins.length);
};

exports["test plugin method is called"] = function() {
    var callbackCalled = false;

    var plugin = {
        hello: function() { callbackCalled = true; }
    };

    var obs = new ObservableWithPlugins({ plugins: [plugin] });
    obs.publish("hello");

    assert.isTrue(callbackCalled);
};
