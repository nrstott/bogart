## v0.5.9

* Ignores `examples` directory in npm releases.

## v0.5.8

* Uses default `directory` middleware configuration if `config` is provided but no 
  no value for `directory` is present in call to `bogart.batteries`.

## v0.5.7

* Updates Q dependency to version 0.9.6. This version of Q has many performance enhancements.

## v0.5.6

* Updates static server example to use `bogart.app`.
* Switches Travis configuration to only run tests in node v0.10.x.
* Updates stream specs for node v0.10.x style streams.
* Fixes a bug with `bogart.pump` resolving its promise at wrong time.

## v0.5.5

* Falls back to `process.nextTick` when setImmediate is unavailable in `ForEachStream`.
* Resolves `ResponseBuilder` promise for the response on first call to `send` to support streaming.
* Add node v0.10.x to Travis configuration.

## v0.5.4

* Changes ForEachStream to use `setImmediate` instead of `process.nextTick`.

## v0.5.3

* Fixes bug preventing passing of options to `bogart.batteries`.

## v0.5.2

* Updates examples to use `bogart.app`.
* Normalizes the return value of `bogart.router` to match other middleware.
* Changes `bogart.error` middleware to match middleware conventions.
* Updates `bogart.session` example to use a custom configuration key.
* Allows configuration of session's `SessionIdProvider` and `SessionDataProvider`
  encryption key from the options parameter to `bogart.session`.
* Removes `bogart.build`.
* Removes `binary` middleware.
* Removes `cascade` middleware.

## v0.5.1

* `SessionDataProvider.loadSession` now returns the session.

## v0.5.0

* Changes order of parameters to `bogart.parted` middleware to match middleware conventions.
* Creates a helper module called `fsp` where node.js `fs` methods are adapted to return promises.
* General housekeeping on the middleware code base to make it more maintainable.
* Changes `bogart.middelware` to be a function that makes creating JSGI middleware easier. 
  All bogart middleware is still attached to the `bogart.middleware` function as properties.
* Removes the deprecated support for passing a configuration function to `bogart.router`.

## v0.3.38

* Changed `bogart.response()` to `bogart.res()` to better fit design philosophy and Node conventions.

## v0.3.37

* Changed signature of view engine renderer function so that the caching mechanism is readily available for view engine implementations.
* ResponseBuilder helper, `bogart.response()`, can now be piped to successfully.

## v0.3.36

* Publishing v0.3.35 from windows seemed to cause issues when installing on unix. Therefore; I am republishing with only a version bump from linux.

## v0.3.35

* Back out change to package.json to add new CLI.

## v0.3.34

* Removed dependency on Q library.

## v0.3.33

* Changed the unit tests in the project from Expresso to Tap.

## v0.3.32

* Did not update package.json in my tag of 0.3.31, went to 0.3.32 for consistency.

## v0.3.31

* Fixed a bug where Parted middleware was not bubbling rejections.

## v0.3.30

* Fixed a bug causing before callbacks to cause errors.

## v0.3.29

* Missed a whenCall, same issue from v0.3.28.

## v0.3.28

* Added dependency on request 2.2.9.
* Removed dependency on Deflate as Node.JS 0.6.x includes zlib.
* Added gzip middleware to `bogart.batteries`
* Added reject callbacks for all cases where whenCall is invoked as it tries to invoke the rejectCallback even if one is not provided.

## v0.3.27

* `bogart.middleware.session` assumed that `req.env` would be unique per request; however, it is not. Corrected issues caused by this.

## v0.3.26

* `bogart.middleware.bodyAdapter` now adapts responses that are of type Buffer or Stream to JSGI responses.
* Fixed a bug in `bogart.middleware.bodyAdatper` where Stream returns were not being handled properly.
* Added `bogart.config`. The default environment is 'development' and may be overridden with the BOGART_ENV environment variable.
* Expose `DefaultIdProvider` and `DefaultDataProvider` as properties of `bogart.middleware.session`.

## v0.3.25

* No longer reject a return that does not include all properties of a valid JSGI response.
  This change facilitates Bogart as a middleware platform.
* Added `bogart.middleware.batteries`, a batteries included JSGI stack for rapid application development.
* The deprecated `bogart.app` has been reclaimed for the purpose of creating application stacks more easily than chaining
  JSGI middleware manually or using `bogart.build`.
* `bogart.build` is deprecated.
* Added `bogart.q` which exposes the promise implementation used by Bogart.
* Added `bogart.promisify` which adapts node-style asynchronous functions to promises.
* Added `bogart.proxy`, a helper to create a JSGI response that proxies a URL.
* Added `viewEngine.share`, a helper for serializing JavaScript to views.  See the new example in 'examples/share-javascript'.

## v0.3.24

* Bug fixes in Session middleware.

## v0.3.23

* Added support for string-based paths with * for splat like /foo/*
* Before callbacks may now return promises that must be resolved before the route handler is executed.
* After callbacks may now return promises that must be resolved before the response from the route handler is returned.

## v0.3.22

* `ViewEngine` is now an `EventEmitter`.
* the built-in `Mustache` view engine now emits `beforeRender` and `afterRender` events.
* Fixed bugs in `Flash` middleware.

## v0.3.21

* `after` had been left off of the public API of router, added it.

## v0.3.20

* Simplified and corrected code for `pipe` method on the request object for the `Parted` middleware.
* Added `Session` middleware.

## v0.3.19

* Updated Parted dependency to 0.8.0.

## v0.3.18

* Mustache partials now work properly when using layouts.

## v0.3.17

* Routes now match in order added instead of longest-first.
* Added `Flash` middleware to emulate the flash method of Rails.

## v0.3.16

* Added `Error` middleware to translate rejected promises and thrown errors into an error response.
* `Error` middleware is included by default in JSGI stacks constructed with `bogart.build`.
* `ParseForm` and `ParseJson` have been replaced with `Parted` in JSGI middleware stacks constructed with `bogart.build`.

## v0.3.15

* Added `Parted` middleware to take advantage of the excellent streaming parsers provided by [Parted](https://github.com/chjj/parted).
* Added multipart-form example to the examples directory to demonstrate usage of the Parted middleware.

## v0.3.14

* use Buffer.byteLength to determine the value for `Content-Length` headers, resolves Issue #11

## v0.3.13

* `bogart.redirect` now accepts a 2nd optional parameter which if present will be merged into the returned response object

## v0.3.12

* Add `before` method to the return from `bogart.router`

## v0.3.10

* Added support for mustache partials to the mustache template engine.  This is unrelated to Bogart partials.
* Match `pathInfo` of "" to "/" if no route found for ""
* Support dot in named parameters

## v0.3.9

* Made view engines registerable.
* Moved 'jade' and 'haml' renderers to their own packages: 'bogart-jade' and 'bogart-haml'.

## v0.3.8

* Removed node-deflate dependency becuase it was sometimes failing to compile when installed with npm.
