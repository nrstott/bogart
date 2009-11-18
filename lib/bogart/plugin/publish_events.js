var Bogart = require("bogart");

/**
 * A Bogart Plugin that allows route handlers to publish events.
 *
 * @constructor
 */
var PublishEvents = exports.PublishEvents = function() {

    this.name = "PublishEvents";
    this.version = "0.0.1";

    this.callbacks = {
        /**
         * Responds to the before_execute_route App event.
         */
        before_execute_route: function(app, routeHandlerContext) {
            routeHandlerContext.publish = Bogart.App.prototype.publish;
        }
    };
};
