var
  jsgi = require('jsgi'),
  bogart = require('../../lib/bogart')

var app = bogart.app(function(show) {
  show('/', function(req, res) {
    return res.render('index.haml')
  })

  this.setting('view root', __dirname + '/views')
})

jsgi.start(app)
