## Getting Started

* Download [Narwhal](http://github.com/tlrobinson/narwhal/tree/master).
* Add the Narwhal bin directory to your PATH `export PATH=$PATH:/path/to/narwhal/bin`
* Install Bogart `tusk install bogart`

## Hello World in Bogart

    var bogart = require("bogart");

    exports.app = new bogart.App(function() {
      this.GET("/:name", function() {
        return this.text("hello " + this.params["name"]);
      });
    });

Start your app: `jackup -r app.js`

Visit it in a web browser at [http://localhost:8080](http://localhost:8080).

## Bogart with Jack.URLMap

    var Bogart = require("bogart").App;
    var URLMap = require("jack").URLMap;

    var hello = new Bogart(function() {
      this.GET("/:name", function() {
        return this.text("hello " + this.params["name"]);
      });
    });

    var calc = new Bogart(function() {
      this.GET("/add/:first/:second", function() {
        var first = parseInt(this.params["first"]);
        var second = parseInt(this.params["second"]);
        return this.text("addition result: " + (first + second).toString());
      });
    });

    exports.app = URLMap({
      "/hello": hello,
      "/calc": calc
    });

## Events

All event callbacks receive the instance of App that called them as the first argument.

Bogart raises the following events:
* before_init: Before any of the options passed to the App constructor have been evaluated.
* before_execute_route: Raised immediately before a route handler is executed.  The callback function will receive
two arguments.  The first argument will contain a reference to the Bogart App raising the event.  The second
will contain the RouteHandlerContext that the route handler that is about to be executed will run inside of.  Use
this event to attach custom helpers to the route's context just before it is executed.
* after_execute_route: Raised after a route handler is executed.  The callback function receives two arguments.  The
first argument contains a reference to the Bogart App raising the event.  The second contains the RouteHandlerContext
in which the route handler was executed.  Use this event to clean up after your before_execute_route callback or to
gather information from the RouteHandlerContext after the route has been executed.

## Subscribing to Events

    var App = require("bogart").App;
    App.subscribeTo("before_init", function(app, options) {
        options.cache_views = false;
    });

## EJS Templates

EJS Template helpers are available in bogart in the route handlers.  Templates are assumed to be under 'views' relative
to the root directory of the application.

### EJS Layout (/views/site.ejs.html)

    <html>
        <head><title>Hello</title></head>
        <body>
            <%= hold() %>
        </body>
    </html>

### EJS Template (/views/hello.ejs.html

    <h1>Hello <%= name %></h1>

### App

    var Bogart = require("bogart").App;
    
    exports.app = new Bogart(function() {
      this.layout = "site";

      this.GET("/:name", function() {
        return this.ejs("hello", { name: this.params.name });
      });
    });

### Results of navigating to /bob

    <html>
        <head><title>Hello</title></head>
        <body>
            <h1>Hello bob</h1>
        </body>
    </html>

## Inspirations

* [Sinatra](http://www.sinatrarb.com/)
* [Rails](http://rubyonrails.org/)

## License

Copyright (c) 2009 Nathan Stott <[nathan.whiteboard-it.com](http://nathan.whiteboard-it.com/)\>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
