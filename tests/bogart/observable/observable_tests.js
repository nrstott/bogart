var assert = require("test/assert");
var observable = require("bogart/observable");
var Observable = observable.Observable;

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
