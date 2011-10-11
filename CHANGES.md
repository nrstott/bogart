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
