var
  jsgi   = require('jsgi'),
  bogart = require('bogart'),
  path   = require('path')

var app = bogart.app(function(show) {
  this.setting('views', path.join(__dirname, 'views')).setting('viewEngine', 'mustache')

  show('/', function(req, res) {
    return res.render('index.html', { locals: { description: 'This is content' } })
  })
})

jsgi.start(app)
