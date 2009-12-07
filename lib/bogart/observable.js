var util = require("util");

/**
 * Creates an Observable object.  The Observable publishes events to which callbacks
 * can be subscribed.
 *
 * example:
 * var observable = Object.create(Observable());
 * observable.subscribeTo("greeting", function() { print("Hello World"); });
 * observable.publish("greeting");   # -> "Hello World"
 *
 * @param subscribers Subscribers hash in the form of { "event_name": callback }
 * @constructor
 */
var Observable = exports.Observable = function (subscribers, followers) {
    subscribers = subscribers || {};
    followers = followers || [];
    
    /**
     * Publish an event.
     *
     * The first argument must be the event to publish.  Additional arguments
     * will be passed to the callbacks subscribed to the event.
     *
     * Example: publish("before_lookup_route", verb, path) would expect a callback in the form of
     * fun(app, verb, path) -> undefined
     * e.g.
     * function(app, verb, path) { ... }
     *
     * @returns The App from which publish was called
     * @type {App}
     * @public
     */
    this.publish = function() {
        var args = Array.prototype.slice.call(arguments);
        var event = args.shift();
        var i, subscriber;

        subscribers[event] = subscribers[event] || [];
        for (i=0;i<subscribers[event].length;++i) {
            subscriber = subscribers[event][i];
            if (typeof subscriber === "function" ) {
                subscriber.apply({}, args);
            }
        }

        followers.forEach(function(x) {
            x.apply({}, args);
        });
    };

    /**
     * Subscribe to all events
     *
     * @param callback Callback to handle any event
     */
    this.follow = function(callback) {
        followers.push(callback);
    };
    
    this.subscribeTo = function(event, callback) {
        subscribers[event] = subscribers[event] || [];
        subscribers[event].push(callback);
    };

    this.unsubscribe = function(callback) {
        for (var key in subscribers) {
            subscribers[key] = subscribers[key].filter(function(x) {
                return x !== callback;
            });
        }
    };

    this.unsubscribeAll = function() {
        subscribers = {};
        followers = [];
    };
};

var ObservableWithPlugins = exports.ObservableWithPlugins = function (options) {
    var observable;
    var oldPublish;
    var plugins;

    options = options || {};
    plugins = options.plugins || [];

    observable = new Observable(options.callbacks || {});
    oldPublish = observable.publish;

    Object.defineProperty(observable, "plugins", {
        get: function() { return plugins; }
    });

    observable.addPlugin = function(obj) {
        plugins.push(obj);
        return observable;
    };

    observable.removePlugin = function(obj) {
        plugins = plugins.filter(function(x) { return x !== obj; });
        return observable;
    };

    observable.removeAllPlugins = function() {
        plugins = [];
        return observable;
    };

    observable.publish = function() {
        var event;
        var args = [];

        for (var i=0;i<arguments.length;++i) {
            args.push(arguments[i]);
        }

        oldPublish.apply(this, args);

        event = args.shift();

        // Check plugins to see if there is a key matching the event name.  If the key points to a function,
        // execute the function.
        plugins.forEach(function(x) {
            if (util.no(x.callbacks)) { return; }

            if (typeof x.callbacks[event] === "function") {
                x.callbacks[event].apply({}, args);
            }
        });
    };

    return observable;
};

exports.mixin = function(other, options) {
    var observable = new ObservableWithPlugins(options || {});
    util.update(other, observable);
};
