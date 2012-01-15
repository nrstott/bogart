# Bogart

A blazing fast rapid application development web framework using JSGI for [node](http://nodejs.org/).

## Getting Started

Bogart can be installed via [npm](https://github.com/isaacs/npm).

    npm install bogart

Alternatively, clone the git repository.

    git clone git://github.com/nrstott/bogart.git

## Hello World in Bogart

Make a directory: `mkdir hello-world`

Create the following file:

### app.js

    var bogart = require('bogart');

    var router = bogart.router();
    router.get('/', function(req) { 
      return "hello world"; 
    });

    router.get('/:name', function(req) {
      return 'hello '+req.params.name;
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
URL matching pattern and a handler function.

    var router = bogart.router();
    router.get('/', function(req) {
      return bogart.html('Hello World');
    });

Routes are tested for matches in the order in which they are defined.

### Route Patterns

Route patterns are matched against URLs.  They may include named parameters that will
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
    // NOTE: Here you would normally add some routes.

    app.use(router);
    app.start();

## Response Helpers

Bogart includes helpers for creating JSGI Responses. The helpers, by convention, take a final
parameter of an options object that allows the caller to override defaults. The options object 
is merged with the default JSGI Response values of the helper before the JSGI Response is returned.

### Respond with JSON

Helper to create a HTTP 200 Success response with a Content-Type of application/json.

Sample Route:

    var router = bogart.router();
    router.get('/', function(req) {
      return bogart.json({ framework: 'Bogart' });
    });

This route yields the following JSGI Response:

    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: [ '{ "framework": "Bogart" }' ]
    }

### Redirect

Helper to create a HTTP 302 Temporary Redirect response.

Sample Route:

    var router = bogart.router();
    router.get('/', function(req) {
      return bogart.redirect('/some/other/url');
    });

This route yields the following JSGI Response:

    {
      status: 302,
      headers: { 'Location': '/some/other/url' },
      body: []
    }

### Error

Helper to create a HTTP 500 Internal Server Error response.

Sample Route:

    var router = bogart.router();
    router.get('/', function(req) {
      return bogart.error('<html>...</html>');
    });

This route yeilds the following JSGI Response:

    {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
      body: [ '<html>...</html>' ]
    }

### Not Modified

Helper to create a HTTP 304 Not Modified response.

Sample Route:

    var router = bogart.router();
    router.get('/', function(req) {
      return bogart.notModified();
    });

This route yeilds the following JSGI Response:

    {
      status: 304,
      headers: {},
      body: []
    }

### File (Streaming!)

Helper to create a HTTP 200 Success response with a body streamed from the contents of a file. The
Content-Type of the response is determined by the mime type of the file.

Sample Route:

    var path = require('path');

    var router = bogart.router();
    router.get('/download/*', function(req) {
      var filePath = path.join(__dirname, 'public', req.params.splat[0]);

      return bogart.file(filePath);
    });

This route yeilds the following JSGI Response:

    {
      status: 200,
      headers: { 'Content-Type': '<mimetype of the file>' },
      body: fileStream // <-- A file stream
    }

### Proxy (Streaming!)

Helper to create a response that proxies the response from a URL.

Sample Route:

    var router = bogart.router();
    router.get('/google', function(req) {
      return bogart.proxy('http://www.google.com');
    });

This route yeilds a JSGI Response that matches the response from the proxied URL.

## Imperative Response Builder

Bogart includes the ResponseBuidler helper to provide an imperative interface. While not
recommended as a goto style of programming in Bogart, there are times when buiding a 
response imperatively makes for cleaner, better code. This is true especially
when working with callback based functions that cannot be wrapped by `bogart.promisify`.

    var router = bogart.router();
    router.get('/', function(req) {
      
      // Get a ResponseBuilder
      var res = bogart.res();

      doSomethingAsync(function(err, messageStr) {
        res.setHeader('Content-Type', 'text/plain');

        if (err) {
          res.status(500);
          res.send('Error');
          return res.end(); // We use return to break out of the function, do not want to continue executing after res.end()
        }

        res.status(200);
        res.send(messageStr);
        res.end(); // End the Response.  This is analagous to resolving a promise for a JSGI Response.
      });

      return res;
    });

## Using Session

The session middleware can be included individually with `app.use(bogart.middleware.session)` or
by using batteries `app.use(bogart.batteries)` which includes a default stack of JSGI middleware.

A `session` function will be available on the request object passed to your route handlers. This
function follows the jQuery style of arity determining if it is getting or setting a key/value pair.
A call to session with one argument is a get to the value of the key referenced by the argument.

    req.session('name'); // => value associated with 'name'

A call to session with two arguments is a set.

    req.session('name', 'Nathan'); // sets the value of 'name' to 'Nathan'

### Contrived Example

A set of two routes that use session:

    router.get('/:name', function(req) {
      req.session('name', req.params.name);
      return bogart.redirect('/');
    });

    router.get('/', function(req) {
      return bogart.html('Hello ' +req.session('name'));
    });

Visiting '/:name' ('/Nathan', '/Bob', etc...) will set a session key that will 
be displayed by the root route '/', after the redirect.

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

### Jade

If you would like to use Jade instead of Mustache, please `npm install bogart-jade`. Then in 
your application add `require('bogart-jade')` and the Jade ViewEngine will be available via
`bogart.viewEngine('jade')`. See [the github repository](https://github.com/nrstott/bogart-jade) for more information.

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

## Promises

Promises provide a well-defined interface for interacting with an object that represents the result of an action that is performed
asynchronously. Why does Bogart use Promises instead of Callbacks for an interface? Because it's prettier and easier to reason about!

In all seriousness, I don't want to get into large arguments about the merits of Promises. Node.JS uses callbacks for its API; however,
user-land applications and frameworks are free to employ higher-level abstractions and Bogart uses Promises.

### Terminology

* Listener: A function listening for the resolution or rejection of a Promise.
* Resolve: A successful Promise is 'resolved' which invokes the success listeners that are waiting and remembers the value that was resolved for future success listeners that are attached.
* Reject: When an error condition is encountered, a Promise is 'rejected' which invokes the error listeners that are waiting and remembers the value that was rejected for future error listeners that are attached.
* Callback: A function executed upon successful resolution of a Promise.
* Errback: A function executed when a Promise is rejected
* Progressback: A function executed to provide intermediate results of a Promise.

### How Promises Work

Promises may only be resolved one time. In the future, when success listeners are added to a 
promise that has already been resolved, the success listener will be invoked with the
previously resolved value. Each success listener or error listener is invoked one time and
one time only.

Promises are not EventEmitters. Many times when describing promises, other coder's ask why 
not just use an EventEmitter. Promises have a different contract. The fact that promises
are resolved or rejected only one time is powerful. EventEmitters have their place; however,
they do not take the place of Promises and Promises do not take the place of EventEmitters.

    function helloWorld() {

      // Retrieve the q promise utility
      var q = require('bogart').q;

      // Create a deferred, a wrapper around a Promise.
      var deferred = q.defer();

      // Do something async
      setTimeout(function() {
        // Resolve the promise, this will cause success listeners to be invoked.
        deferred.resolve('hello world');
      }, 100);

      // Return the promise that the deferred wraps to the client.
      return deferred.promise;
    }

    // Consuming the helloWorld function
    var p = helloWorld();
    p.then(function(msg) {
      // This function will be invoked on success
      console.log(msg);
    }, function(err) {
      // This function will be invoked on error.
      console.log(err);
    });

### The `then` Method

`promise.then(callback, errback, progress)`

A promise will have a `then` method which takes up to three parameters. The three parameters are all optional.
The first parameter, `callback`, is executed if the Promise is successfully resolved. The second parameter, `errback`, is 
executed if the Promise is rejected. The third parameter, `progress`, is used to provide intermediate feedback on the 
asynchronous operation. This parameter is rarely used. Most promises do not report progress.

### The `when` Function

`bogart.q.when(promiseOrValue, callback, errback, progress)`

The `when` function in the `bogart.q` namespace is helpful when you do not know if what you have is a value or a promise for a 
value. The callback will be executed for success for a resoled promise or for the value passed if it is a value and not a promise.

    // The following two lines are equivalent with the exception that the `when` can 
    // handle values that are not promises.
    q.when(p, function() { console.log('Success'); });
    p.then(function() { console.log('Success'); });

### Bubbling

Promises can be 'bubbled'. The return value of a callback becomes the value of an external promise. The same is true of errbacks.

    function bubble(p) {
      return p.then(function() {
        // Assume makePromise is a function that returns a promise for an asyncronous operation.
        // The value of makePromise when resolved becomes the resolution of the `bubble` function as well.
        return makePromise();
      });
    }

Bubbling errbacks is paralell to having a try/catch at a higher level handle errors at a lower level.

    p.then(function(url) {
      return request(url).then(function() {
        throw 'error';
      });
    }, function(err) {
      // Will handle the error that occurs in the callback of `request.then`.
      console.log(err);
    });

### Working with Node.JS Callbacks

Node.JS uses a style of callback with the following signuare: `function(err, result)`. Bogart includes a utility function,
`bogart.promisify`, to adapt these Node.JS-style functions to return a Promise.

    var fs = require('fs'); // Node File System Module
    var bogart = require('bogart'); // Include Bogart

    // A promise-based version of fs.readFile.
    var readFile = bogart.promisify(fs.readFile);

    readFile('test.txt').then(function(data) {
      console.log(data);
    });

*NOTE*: A Node.JS-style function which calls its callback multiple times is not compatible with promises. 
A Promise may be resolved only once. Node.JS style functions that call their callback multiple times are  
uncommon. The vast majority of Node.JS style functions can be safely translated using `bogart.promisify`.

### Promises are 'A Good Thing'

There are a lot of critiques of Promises. These usually come from programmers who have not used a proper Promise library.
Turst me, promises are 'A Good Thing'. Your code will be more composable, readable, and maintainable if you choose to use
Promises instead of Callbacks for your API. It is also quite easy to transalate Node.JS style callbacks into promises using
`bogart.promisify` so working wtih callback based APIs is still simple.

## JSGI

JSGI stands for JavaScript Gateway Interface. It is an interface between web applications and web servers. It is similar to
Ruby's Rack and Python's WSGI.

### Entities

* Application: A JavaScript Function that takes one argument, the Request as a JavaScript Object, and returns its Response as a JavaScript Object containing three required attributes: status, headers, and body.
* Middleware: JSGI Applications that can call other JSGI Applications. Middleware can be orgonized into a call chain to provide useful services or perform useful business logic.
* Request: A JavaScript Object that contains the state of the HTTP request.  JSGI Applications and Middleware are free to modify the request object.

### Bogart Relationship to JSGI

Bogart makes it easy to create JSGI Applications and Middleware. Bogart is a high-level wrapper around JSGI.

Valid JSGI responses are always valid returns from Bogart. Bogart, via its helpful Middleware, also allows you to return
Node.JS Streams, Node.JS Buffers, and JavaScript Strings as responses that will be translated into valid JSGI responses.

Bogart also provides helper functions to make creating JSGI responses easier. Prime examples of this are `bogart.file` which
returns a JSGI response that serves a file and `bogart.proxy` which returns a response that proxies another URL.

## Supporting Modules

* [Jade View Engine](https://github.com/nrstott/bogart-jade): `npm install bogart-jade`

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