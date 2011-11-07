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

    var site = bogart.router(function(get, create, update, del) {
      get('/', function(req) { 
        return bogart.html("hello world"); 
      });

      get("/:name", function(req) {
        return bogart.html("hello " + req.params.name);
      });
    });
    
    bogart.start(site);

Start your app: `node app.js`

Visit it in a web browser at [http://localhost:8080](http://localhost:8080).
Visit the route that says hello to you by name at [http://localhost:8080/bob](http://localhost:8080/bob)

## Running the Examples

In the 'examples' directory of the cloned source, there are several examples of bogart applications.

### Hello World

The hello world example demonstrates a basic bogart applications.  The application has a route, /hello, that takes a name
as a parameter in the request URL.  The application responds with 'hello <name>'

    > cd examples
    > node hello-world.js

Visit the application in your web browser at [http://localhost:8080/hello/jim](http://localhost:8080/hello/jim)

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
Bogart comes with a variety of standard JSGI middleware appliances (not enabled by default).

#### Serve Static Files
The static example demonstrates using bogarts *Directory* middleware to serve an image.

    > cd examples/static-server
    > node app.js
    
Visit the application in a web browser at [http://localhost:8080/](http://localhost:8080).
You should see the image.

#### ParseJson
Parses the body of any request with an "application/json" content-type. The value of request body is reassigned with the parsed value.

#### ParseForm
Parses the body of any request with an "application/x-www-form-urlencoded" content-type. The value of request body is reassigned with the parsed value.

#### Flash
Provides Ruby-esque 'flash' variables, good only for the next request cycle. Flash session tracking and flash data is stored via encrypted cookies by default. These providers can be overriden with the Flash middleware options. An example flash data provider implementation with a Redis backend is available here: [https://github.com/jdc0589/bogart-flash-redis](https://github.com/jdc0589/bogart-flash-redis)

#### Gzip
Gzip compresses the response and assigns the proper content-encoding;

#### MethodOverride
Checks for the _method parameter or X-HTTP-METHOD-OVERRIDE header to override the HTTP method.

#### Error
Translates rejected promises to a JSGI error response.

## Contributors

* [Nathan Stott](https://github.com/nrstott)
* [Nick Fitzgerald](https://github.com/fitzgen)
* [Martin Murphy](https://github.com/soitgoes)
* [Davis Clark](https://github.com/jdc0589)
* [Aaron Shafovaloff](https://github.com/aaronshaf)

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