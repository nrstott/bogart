# View Engine

The Bogart `ViewEngine` is responsible for rendering templates.
It supports partials and layouts. The `ViewEngine` comes with
support for [Mustache](http://mustache.github.com/). It provides
plugin capability to support other templating engines.

## bogart.viewEngine(engine, [viewRoot], [options])

* engine `String`  The name of the rendering engine. Defaults to `mustache`.
* viewRoot `String`  Root directory used to resolve templates. Defaults to `views`.
* options `ViewEngineOptions`

## viewEngine.render(template, [options])

* template `String`  Path to the template. Relative paths are resolved
                     from the root provied to bogart.viewEngine. Defaults
                     to `views`.

The `render` method uses the selected templating engine to render the specified view
with variables from RenderOptions#locals.

Rendering a view with mustache and replacement variables:

    var viewEngine = bogart.viewEngine('mustache');
    viewEngine.render('index.html', { locals: { title: 'Hello Mustache' } });

## viewEngine.respond(template, [options])

* template `String` Template to render.
* options `ViewEngineOptions` See class `ViewEngineOptions`.

Returns a promise for a `bogart.Response`.

    var viewEngine = bogart.viewEngine('mustache');
    var res = viewEngine.respond('index.html', { locals: { title: 'Hello Mustache' } });

Response would look like this:

    {
      status: 200,
      headers: {
        'content-type': 'text/html'
      },
      body: [ 'the contents rendered from index.html would be here' ]
    }

## Class: ViewEngineOptions

* viewEngineOptions.cache `Boolean`  Determines whether views are cached or reloaded
                                     from disk when rendered.

Options for constructing a `ViewEngine`.

## Class: RenderOptions

* renderOptions.layout `Boolean|String`  Defaults to `layout.html`. A `String` value indicates
                                         the layout template to resolve using normal template
                                         resolution. A value of `false` indicates that no layout
                                         should be used. A value of `true` indicates that
                                         the default of `layout.html` should be used.
* renderOptions.locals `Object|Array`  Value(s) to be passed to the rendering engine.

## Layouts

Layouts help templates that are applicable to multiople pages.  
By default, if there is a file named 'layout.{ext}' where
`ext` is the extension of the view (haml, jade, mustache, html, etc...) then this file
is used as the layout for the view.  The layout is given a variable named
`body` that contains the contents of view. 
The `body` variable should not be HTML escaped. In Mustache, this means using 
triple mustache form: `{{{body}}}`.

Specifying the file extension of a template is optional as long as the file extension
matches the default file extension associated with the template type.  For example, if
using Jade then `viewEngine.render('index')` is equivalent to `viewEngine.render('index.jade')`.

### Mustache Example

View (index.html):

    Welcome {{firstName}}!

Layout (layout.html):

    <html>
      <head>
        <title>{{title}}</title>
      </head>
      <body>
        <h1>{{title}}</h1>

        {{{body}}}
      </body>
    </html>

App (app.js):

    var bogart = require('bogart');
    var viewEngine = bogart.viewEngine('mustache');
    var router = bogart.router();

    router.get('/hello/:firstName', function(req) {
      return viewEngine.respond('index.html', {
        locals: { title: 'Hello', firstName: req.params.firstName }
      });
    });

    var app = bogart.app();
    app.use(router);
    app.start();

Execute `node app.js` and visit [http://localhost:8080/hello/bogart](http://localhost:8080/hello/bogart).

## Partials

Sometimes, especially with AJAX requests, it is desirable to return a view without rendering it inside of a 
layout even if a layout is present.  To acccomodate this, the View Engine has a `partial` method.  The `partial`
method takes the same arguments as the `render` method but does not render its template insdie of
a layout.

    var viewEngine = bogart.viewEngine('mustache');
    viewEngine.partial('index.html');

