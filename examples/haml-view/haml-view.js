var
  jsgi = require('jsgi'),
  bogart = require('../../lib/bogart')

var app = bogart.app(function(show) {
  show('/', function(req, res) {
    return res.render('index.haml', { layout: false })
  })

  this.setting('views', __dirname + '/views')
})

jsgi.start(app)
