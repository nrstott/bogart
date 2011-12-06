# View Engine

The Bogart `ViewEngine` renders view.  It handles partials and layouts as well.
The `ViewEngine` ships with support for [Mustache](http://mustache.github.com/), 
[Jade](http://jade-lang.com/), and [Haml](http://haml-lang.com/).

## view.viewEngine(engine)

Creates a `view.ViewEngine`.

## ViewEngine.render(template, [options])

The `render` method uses the selected templating engine to render the specified view
with options specified in the options `locals` object.

Rendering a view with mustache and replacement variables:

    var viewEngine = bogart.viewEngine('mustache');
    viewEngine.render('index.html', { locals: { title: 'Hello Mustache' } });

## ViewEngine.respond(template, [options])

The `respond` method returns a promise for a JSGI response that will render the 
specified view.

    var viewEngine = bogart.viewEngine('mustache');
    viewEngine.respond('index.html', { locals: { title: 'Hello Mustache' } });

## view.RenderOptions

Options passed to `viewEngine.render` and `viewEngine.respond` should quack like view.RenderOptions.

* opts.layout  The name of the layout or a boolean. If `true` then the name is defaulted to 'layout.html'. If `false` then no layout should be used.
* opts.locals  Context in which to render the template. This should contain the replacement values of variables in your templates.

## Layouts

Layouts are supported.  By default, if there is a file named 'layout.{ext}' where
`ext` is the extension of the view (haml, jade, mustache, html, etc...) then this file
is used as the layout for the view.  The layout is expected to render a variable named
`body`.  The `body` variable will contain the contents of view being rendered into the
layout.  The `body` variable should not be HTML escaped.

Specifying the file extension of a template is optional as long as the file extension
matches the default file extension associated with the template type.  For example, if
using Jade then `viewEngine.render('index')` is equivalent to `viewEngine.render('index.jade')`.

### Mustache Example

Mustache is the default template engine of Bogart.

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

    bogart.start(router);

Execute `node app.js` and visit [http://localhost:8080/hello/bogart](http://localhost:8080/hello/bogart).

### Jade Example

Make sure to install bogart-jade from npm before running these examples.

View (index.jade):

    Welcome #{firstName}!

Layout (layout.jade):

    html
      head
        title #{title}
      body
        h1 #{title}
        !{body}

App (app.js):

    var bogart = require('bogart');
    var viewEngine = bogart.viewEngine('jade');
    var router = bogart.router();
    
    router.get('/hello/:firstName', function(req) {
      return viewEngine.respond('index', {
        locals: { title: 'Hello', firstName: req.params.firstName }
      });
    });

    bogart.start(router);

Execute `node app.js` and visit [http://localhost:8080/hello/bogart](http://localhost:8080/hello/bogart).

## Partials

Sometimes, especially with AJAX requests, it is desirable to return a view without rendering it inside of a 
layout even if a layout is present.  To acccomodate this, the View Engine has a `partial` method.  The `partial`
method takes the same arguments as the `render` method but does not render its template insdie of
a layout.

    var viewEngine = bogart.viewEngine('mustache');
    viewEngine.partial('index.html');

