# Routing

Routing in Bogart is simple and intuitive.  A route is a HTTP method paried with a
URL matching pattern and a function to call to handle requests to the route.

    var router = bogart.router();
    router.get('/', function(req) {
    	return bogart.html('Hello World');
    });

Routes are tested for matches in the order in which they were defined.

## Route Patterns

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

## Regex Routes

When a route pattern is not powerful enough, regular expressions may be used to specify which
URLs are to be matched.

    var app = bogart.router();
    app.get(/\/posts?/, function(req) {
    	// Matches 'post' or 'posts'
    	return bogart.html('Regex Route');
    });

Parameters are via regular expression groups in regular expression routes.  The parameter values
are put in an `Array` in `req.params.splat` of the `req` object passed to the route handler.

    var app = bogart.router();
    app.get(/hello-(.*)/, function(req) {
    	var name = req.params.splat[0];
    	return bogart.html('Hello '+name);
    });
