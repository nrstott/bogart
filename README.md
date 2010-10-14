## Getting Started

* Install nodules (npm install nodules)

## Hello World in Bogart

Make a directory: `mkdir hello-world`

Create the following two files:

### app.js

    var site = bogart.router(function(get, create, update, del) {
      get('/', function(req) { 
        return bogart.html("hello world"); 
      });

      get("/:name", function(req) {
        return bogart.html("hello " + req.params.name);
      });
    });

### package.json

    {
      "name": "Bogart Hello World",
      "author": "<Enter Your Name>",
      "mappings": {
        "bogart": "jar:http://github.com/nrstott/bogart/zipball/master!/lib/bogart"
      }
    }

Start your app: `nodules app.js`

Visit it in a web browser at [http://localhost:8080](http://localhost:8080).
Visit the route that says hello to you by name at [http://localhost:8080/bob](http://localhost:8080/bob)

## Inspirations

* [Sinatra](http://www.sinatrarb.com/)
* [Rails](http://rubyonrails.org/)

## Contributors

* [Nathan Stott](http://github.com/nrstott)
* [Nick Fitzgerald](http://github.com/fitzgen)
* [Martin Murphy](http://github.com/soitgoes)

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
