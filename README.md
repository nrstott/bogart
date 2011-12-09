## Getting Started

Bogart can be installed via [npm](https://github.com/isaacs/npm).
    npm install bogart

Alternatively, clone the git repository.
    git clone git://github.com/nrstott/bogart.git

## Hello World in Bogart

Make a directory: `mkdir hello-world`

Create the following file:

### app.js

    var bogart = require("bogart");

    var router = bogart.router();
    router.get('/', function(req) { 
      return "hello world"; 
    });

    router.get("/:name", function(req) {
      return "hello "+req.params.name;
    });
    
    var app = bogart.app();
    app.use(bogart.batteries); // A batteries included JSGI stack including streaming request body parsing, session, flash, and much more.
    app.use(router); // Our router

    app.start();

Start your app: `node app.js`

Visit it in a web browser at [http://localhost:8080](http://localhost:8080).
Visit the route that says hello to you by name at [http://localhost:8080/bob](http://localhost:8080/bob)

## Changing the port

If you can't run on 8080, change the `app.start` call e.g. `app.start(9090, '127.0.0.1')`

## Routing

Routing in Bogart is simple and intuitive.  A route is a HTTP method paried with a
URL matching pattern and a function to call to handle requests to the route.

    var router = bogart.router();
    router.get('/', function(req) {
      return bogart.html('Hello World');
    });

Routes are matched first based upon the length of the match and second based upon the
order in which they were defined.  Regular expression routes are matched before string
pattern routes.

### Route Patterns

Route patterns are matched vs URLs.  They may include named parameters that will
be accessible via the `params` object of the `req` object passed to the route handler.

    var router = bogart.router();
    router.get('/hello/:name', function(req) {
      var greeting = 'Hello '+req.params.name;
      return bogart.html(greeting);
    });

It is also possible to access named parameters via arguments passed to the handler function.
Named parameters will be passed in the order they are speicifed in the route pattern.

    var router = bogart.router();
    router.get('/hello/:name', function(req, name) {
      return bogart.html('Hello '+name);
    });

Route patterns support wildcards. Wildcards will match anything whereas regular named parameters
will not match beyond a path separator ("/").

    var router = bogart.router();
    router.get('/hello/*', function(req, name) {
        return bogart.html('Hello '+req.params.splat[0]);
    });

### Regex Routes

When a route pattern is not powerful enough, regular expressions may be used to specify which
URLs are to be matched.

    var router = bogart.router();
    router.get(/\/posts?/, function(req) {
      // Matches 'post' or 'posts'
      return bogart.html('Regex Route');
    });

Parameters are via regular expression groups in regular expression routes.  The parameter values
are put in an `Array` in `req.params.splat` of the `req` object passed to the route handler.

    var router = bogart.router();
    router.get(/hello-(.*)/, function(req) {
      var name = req.params.splat[0];
      return bogart.html('Hello '+name);
    });

## Bogart Application

`bogart.app` makes it easy to setup a middleware chain and start coding. Combined with 
`bogart.batteries` (See Below), you can setup a full-stack JSGI application in two lines of code.

    var app = bogart.app();
    app.use(bogart.batteries);

After adding `bogart.batteries`, you will normally want to add a Router. This is also done
with `app.use`. To start the application, use the `start` method.

    var app = bogart.app();
    app.use(bogart.batteries);

    var router = bogart.router();
    // Setup Routes

    app.use(router);
    app.start();

[Read more about the `bogart.App` class](/docs/app.md).

## Running the Examples

In the 'examples' directory of the cloned source, there are several examples of bogart applications.

### Hello World

The hello world example demonstrates a basic bogart applications.  The application has a route, '/:name', that takes a name
as a parameter in the request URL.  The application responds with 'hello <name>'.  It also has a route, '/', that responds with `hello world`.

    > cd examples
    > node hello-world.js

Visit the application in your web browser at [http://localhost:8080/Jim](http://localhost:8080/Jim)

### Mustache Template with Layout

This example demonstrates usage of the mustache templating engine and a mustache layout.  A layout is a page designed
to hold other templates to avoid duplication of content.

    > cd examples/mustache-layout
    > node app.js

Visit the application in a web browser at [http://localhost:8080/](http://localhost:8080)    

### Haml

Haml is an optional dependency of bogart.  Please install it via `npm install haml` if you wish to use this templating
engine.

The Haml sample demonstrates a haml view without a layout.

    > cd examples/haml-view
    > node app.js

Visit the application in a web browser at [http://localhost:8080/](http://localhost:8080)    

## Middleware
Bogart comes with a variety of JSGI middleware appliances. The `batteries` appliance includes a recommended JSGI application chain for
normal usage.

#### Batteries
Frameworks are better when they come batteries included. Bogart ships with the batteries, it's just up to you to put them in if you
want to use them.

The batteries middleware creates the following JSGI chain where `nextApp` is the JSGI appliance passed as the first parameter
to `batteries`:

    error -> validateResponse -> directory -> parted -> methodOverride 
          -> session -> flash -> bodyAdapter -> stringReturnAdapter -> nextApp

The binary middleware is configured to check the path of the request and if it corresponds to a potential directory in the 'public' directory,
the request is routed to the `directory` middleware to serve a static file.

#### Binary Split
Choose between two JSGI appliances based upon the request.

#### Serve Static Files
The static example demonstrates using bogarts *Directory* middleware to serve an image.

    > cd examples/static-server
    > node app.js
    
Visit the application in a web browser at [http://localhost:8080/](http://localhost:8080).
You should see the image.

#### Error
Translates rejected promises to a JSGI error response.

#### Flash
Provides Ruby-esque 'flash' variables, good only for the next request cycle. Flash session tracking and flash data is stored via encrypted cookies by default. These providers can be overriden with the Flash middleware options. An example flash data provider implementation with a Redis backend is available here: [https://github.com/jdc0589/bogart-flash-redis](https://github.com/jdc0589/bogart-flash-redis)

#### MethodOverride
Checks for the _method parameter or X-HTTP-METHOD-OVERRIDE header to override the HTTP method.

#### ParseJson
Parses the body of any request with an "application/json" content-type. The value of request body is reassigned with the parsed value.
Use the Parted middleware instead unless you have a specific reason not to as it contains a superset of this functionality and also performs streaming parsing.

#### ParseForm
Parses the body of any request with an "application/x-www-form-urlencoded" content-type. The value of request body is reassigned with the parsed value.
Use the Parted middleware instead unless you have a specific reason not to as it contains a superset of this functionality and also performs streaming parsing.

#### Parted
A JSGI wrapper around the excellent [Parted](https://github.com/chjj/parted) middleware for Connect.
Parted is a streaming multipart, json, and urlencoded parser.

#### Session
Standard flash middleware for bogart. Session id and data are stored in encrypted cookies by default, however this can be overridden with custom storage providers. A redis backed session data store is available here: [https://github.com/jdc0589/bogart-session-redis](https://github.com/jdc0589/bogart-session-redis)

## Design Philosophy

* Public APIs should be terse. Prefer `bogart.app()` to `new bogart.Application()`.
* Be verbose when it does not increase typing for the API user.
  A good example of this would be in naming of function parameters. The parameter
  name does not affect the user of the API, so making it more verbose makes for
  better self-documenting code.
* Use [promises](http://wiki.commonjs.org/wiki/Promises) when the contract fits. Never use an EventEmitter that should only
  be attached to in a specific scope and will only call a success and/or error callback
  one time.
* Use [EventEmitter](http://nodejs.org/docs/latest/api/events.html#events.EventEmitter) for signals that can fire any number of times.
* Prefer composition to inheritance.
* Avoid manipulating prototypes of Node.JS constructors. Manipulating prototypes makes for harder to understand code.
  Also, Bogart is expected to be cross-platform in the future.

## Contributors

* [Nathan Stott](https://github.com/nrstott)
* [Nick Fitzgerald](https://github.com/fitzgen)
* [Martin Murphy](https://github.com/soitgoes)
* [Davis Clark](https://github.com/jdc0589)
* [Aaron Shafovaloff](https://github.com/aaronshaf)
* [Lewis Patterson](https://github.com/lpatters)

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