var 
  bogart = require('../lib/bogart'),
  jsgi = require('jsgi')

var app = bogart.app(function(show, create, update, destroy) {
  show('/hello/:name', function(req, resp, name) {
    resp.send("Hello ")
    resp.send(name)
  })
})

jsgi.start(app)
