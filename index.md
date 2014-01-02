---
title: Bogart
layout: default
---

# Quick Start

Do you have node installed? If not, [install it](http://nodejs.org) then
lets get started.

Lets make our first Bogart app!

    mkdir hello-bogart
    cd hello-bogart

Create a `package.json` file in your `hello-bogart` directory.

    {
      "name": "hello-bogart",
      "private": true,
      "version": "0.1.0"
    }

Great, now lets install bogart.

    npm install bogart --save

The `--save` flag tells npm to add the dependency to your `package.json`. Open
`package.json` again and if everything worked, it should now look like this:

{% highlight javascript %}
{
  "name": "hello-bogart",
  "private": true,
  "version": 0.1.0,
  "dependencies": {
    "bogart": "~0.5.14"
  }
}
{% endhighlight %}

Also, a new directory, `node_modules`, was created by npm in your `hello-bogart` directory.
The `node_modules` directory holds localized copies of dependencies declared in the 
`package.json`. If you want to update your dependencies later, you can do so by executing
`npm update` in your `hello-bogart` directory.

You can verify that Bogart was installed as a package by executing `npm ls`.

Now, create an `app.js` file.

{% highlight javascript %}
var bogart = require('bogart');

var router = bogart.router();
{% endhighlight %}

With an instance of `Router`, you can now add routes using the `get`, `post`, `put`,
and `del` methods.

{% highlight javascript %}
router.get('/', function (req) {
  return {
    status: 200,
    headers: { 'content-type': 'text/plain' },
    body: 'Hello World'
  };
});
{% endhighlight %}

This adds a route handler responding to GET "/". The result of the route is specified
declaratively as a JSON object containing three properties: `status`, `headers`, and `body`.

The `status` property is the HTTP Status code to return.

The `body` may be a String, an Array, a Buffer, or a Stream.

The `headers` property is case-insensitive. `content-type` and `Content-Type` are equivalent; however,
in Bogart, the lower-case variant is preferred (Who wants to hold down that shift key? Not this guy!).

What about this `req` parameter? That is the bogart `Request` object. It has useful information
about the request for the route.

* method: HTTP method, lower-case.
* version: Parsed HTTP Version. HTTP 1.1 will be parsed to [1,1] for example.
* headers: Read-only map of header names and values. Header names are lower-case.
* href: Full URL requested.
* isXMLHttpRequest: Boolean indicating if the request was made via XHR.
* nodeRequest: the raw node request object.
* routeParams: An object containing the named route parameters.
* params: Combines the route parameters, form parameters, and query string parameters. Precendence for conflicting
          names is resolved in the following order: route parameters -> form parameters -> query string parameters.
* hostname: Host part of the URL ex: whiteboard-it.com
* hostName: alias of hostname for those who prefer camel case to being consistent with location object.
* host: Hostname and Port portion of the URL ex: whiteboard-it.com:8080
* protocol: Protocol of the request including the final \':\' ex: http:, https:
* path: Initial \'/\' followed by the path of the URL without the querystring.
* pathname: Initial \'/\' followed by the path of the URL.
* search: Contains a \'?\' followed by the parameters of the URL.

Don\'t worry, the URL will not be parsed until you call one of these methods so you incur no
performance penalty if you do not access them.

Next, create and start the bogart app.

{% highlight javascript %}
var app = bogart.app();
app.use(router); // Add router to the app
app.start();
{% endhighlight %}

Note the `app.use(router)` call adds the router to the App chain. You can have
as many routers as you want to isolate routes in a logical manner. `app.use` also
allows you to add middelware.

Bogart middleware is in the form of a function that takes the next step in the chain and
returns a function that takes a request and returns a response.

{% highlight javascript %}
function LogRequest(next) {
  return function (req) {
    console.log('Request', req);

    return next(req).then(function (res) {
      console.log('Response', res);
      return res;
    });
  };
}
{% endhighlight %}

First things first, Bogart embraces [Promises](http://howtonode.org/promises) as a
control-flow mechanism. The LogRequest middleware expects that what is returned from
the call to `next(req)` will be a promise. This is a safe assumption in Bogart. If a non-promise
is returned from a route, Bogart will wrap it in a Promise.

So where does this `next` parameter come from? Don\'t worry about it! Bogart figures it out.
Let's alter the previous code sample where we created the app and added the router to it.

{% highlight javascript %}
    var app = bogart.app();
    app.use(LogRequest)
    app.use(router);

    app.start();
{% endhighlight %}

Now run the server using `node app.js`. When you view it on `localhost:8080`, you should see messages
in your terminal each time you refresh the page showing you the request and response objects.

The order in which the `app.use` statements are called is significant. You must call
them in the order you want them to execute.

Also, bogart provides a middleware helper to make writing middleware a little nicer. Rewriting
LogRequest using the helper looks like this:

{% highlight javascript %}
var LogRequest = bogart.middleware(function (req, next) {
  console.log('Request', req);

  return next(req).then(function (res) {
    console.log('Response', res);
    return res;
  });
});
{% endhighlight %}

Note that the `next` parameter is optional. If you ignore it, you\'re just writing an end-point
that will ignore anything after it in the middleware chain. Simply not calling `next` is a way
of ending the chain.

What if I don't want *every* request to be logged? Bogart lets you target middleware to specific
routes.

{% highlight javascript %}
router.get('/', LogRequest, function (req) {
  return {
    status: 200,
    headers: { 'content-type': 'text/plain' },
    body: 'Hello World'
  };      
});
{% endhighlight %}

You can provide as many middleware functions as you want to the router verb methods.

# Views

Most Bogart appications will want to use some templating and not just return hand-built
resuilt from routes. Bogart comes with a `ViewEngine` that makes this easier. The `ViewEngine`
is an abstraction around templating languages with support for layouts and partials.

Bogart comes with Mustache by default. Other view engines may be added via the plugin mechanism.

So how do we use the view engine?

Add the following in app.js:

{% highlight javascript %}
var viewEngine = bogart.viewEngine('mustache');

router.get('/mustache-rocks', function (req) {
  var body = viewEngine.render('mustache-rocks.html', {
    locals: {
      title: 'Hello View Engine'
    }
  });

  return {
    status: 200,
    headers: { 'content-type': 'text/html' },
    body: body
  };
});
{% endhighlight %}

Create a `views/mustache-rocks.html` file:

{% highlight html %}
<h1>Mustache Rocks!</h1>
<p>{{title}}</p>
{% endhighlight %}

Create a `views/layout.html` file:

{% highlight html %}
<html>
<head>
  <title>{% raw %}{{title}}{% endraw %}</title>
</head>
<body>
  {% raw %}{{{body}}}{% endraw %}
</body>
{% endhighlight %}

What have we here? The `layout.html` file contains markup that is to be reused
for many pages. The `title` variable is provided from the `locals` property in the call
to `viewEngine.render`. The `body` variable is special. It will contain the rendered
code from `index.html`. Note how we use `title` in both `index.html` and in `layout.html`.
Also note how a triple mustache is used for `body`. This is because the `body` variable
already contains HTML escaped code and so does not need to be HTML escaped again. The triple
mustache tells mustache not to re-HTML escape it.

You can find the source code for these examples at
[github](http://github.com/nrstott/hello-bogart).

For more Bogart fun, check out the [API Docs](/docs/index.html) or more [tutorials](/tutorials/index.html).

Have a question? [Email me](mailto:nrstott@gmail.com).
