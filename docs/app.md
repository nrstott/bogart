# App

The Bogart Application constructor, `bogart.app`, exposes a helper for creating JSGI
servers.

## app.start([port], [hostname])

Start a server to accept connections on port and hostname. If hostname is ommitted,
connections on any IPv4 address will be accepted.

This function is asynchronous and returns a promise.

## app.use(middleware)

Add a JSGI application (middleware) or Bogart Router to the server's JSGI stack.

## Event: 'beforeAddMiddleware'
`function(app, args) { }`

Emitted before `app.use` inserts the application or router into the JSGI stack.

## Event: 'afterAddMiddleware'
`function(app, middleware) { }`

Emitted after `app.use` inserts the application or router into the JSGI stack.
