## v0.3.21

* `after` had been left off of the public API of router, added it

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
