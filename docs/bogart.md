# Bogart

### bogart.viewEngine(engine)

Forwarded from `view.viewEngine`.

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

### bogart.permanentRedirect(url, [options])

Creates a JSGI response with a status of 301, permanent redirect. The options parameter will be 
merged with the resulting JSGI object if provided to allow overriding or addition of other
properties.

### bogart.notModified([options])

Creates a JSGI response with a status of 304, not modified. The options parameter will be 
merged with the resulting JSGI object if provided to allow overriding or addition of other
properties.