# Bogart

## Utility

### bogart.q

Namespace for promise functions. See the q module documentation for more information.

### bogart.promisify(nodeAsynchronousFunction, context)

Adapts a NodeJS style asynchronous function to return a promise.
A NodeJS style asynchronous function is a function that takes as its last parameter a callback.
The callback expects that the first parameter when it is called will be an error if it exists
or falsey if there is no error. The second parameter is the success value for the callback.

Promisify works on NodeJS asynchronous functions that only call their callback one time. If a 
functions calls its callback multiple times, it is not a candidate to be wrapped in a promise as
promises may only be resolved one time.

## Core

### bogart.app()

Create a Bogart Application, a helper for composing stacks of JSGI middleware and Bogart routers.

Please see [Application](/app/) for more information.

### bogart.router([config], nextApp)

Creates a Bogart Router, a JSGI middleware appliance that makes it easy to execute functions
depending on the request path.

Please see [Routing](/routing/) for more information.

### bogart.start(jsgiApp, [options])

Begin listening on the default port, 8080, or the port specified in options.port if options are provided.
jsgiApp should be a JSGI function that serves as the entry point for the server.

### bogart.viewEngine(engine)

Forwarded from `view.viewEngine`. Please see the [View Engine documentation](/view-engine/) for more information.

## View Helpers

### bogart.error(msg, opts)

Creates a JSGI response with a body of msg, a "Content-Type" of "text/html", and 
a status of 500. The options parameter will be merged with the resulting JSGI object if
provided to allow overriding or addition of other properties.

### bogart.html(html, [options])

Creates a JSGI response with a body of html. The options parameter may be used to
override properties of the JSGI response like headers and status.

### bogart.text(str, [options])

Create a JSGI response with a "Content-Type" of "text/plain" and a body containing str. The
options parameter will be merged with the resulting JSGI object if provided to allow overriding
or addition of other properties.

### bogart.json(obj, [options])

Creates a JSGI response with a "Content-Type" of "application/json" and a body containing the 
JSON representation of obj. The options parameter will be merged with the resulting JSGI object
if provided to allow overriding or addition of other properties.

### bogart.redirect(url, [options])

Creates a JSGI response with a status of 302, temporary redirect. The options parameter will be 
merged with the resulting JSGI object if provided to allow overriding or addition of other
properties.

### bogart.response([viewEngine])

Instantiates a ResponseBuilder, a utility object that aids in constructing responses imperatively.

### bogart.permanentRedirect(url, [options])

Creates a JSGI response with a status of 301, permanent redirect. The options parameter will be 
merged with the resulting JSGI object if provided to allow overriding or addition of other
properties.

### bogart.notModified([options])

Creates a JSGI response with a status of 304, not modified. The options parameter will be 
merged with the resulting JSGI object if provided to allow overriding or addition of other
properties.

## ResponseBuilder

ResponseBuilder is returned by `bogart.response`. ResponseBuilder is a utilty class
for composing JSGI responses imperatively.

### ResponseBuilder.end()

The end method must be called when you are finished constructing the response.

### ResponseBuilder.headers(headers)

Overwrite the response headers.

### ResponseBuilder.render(view, [options])

Renders view to the response body. If a View Engine was not provided, raises an error.

### ResponseBuilder.status(num)

Set the status of the response to num.

### ResponseBuilder.send(content)

Add content to the response body.

### ResponseBuilder.setHeader(header, value)

Set header to value.

### ResponseBuilder.statusCode

Property for getting and setting the status code of the response.