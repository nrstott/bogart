var middleware = require('./middleware');

/*
 * Renders `template` using `viewEngine`.
 * ViewEngine#respond is called with the results of 
 * the `next` apps response.
 *
 * Example:
 *
 *     var router = bogart.router();
 *     router.get('/', bogart.middleware.renderView('index.html'), function (req) {
 *       return { locals: { title: 'Bogart' }, layout: true };
 *     });
 *
 * @param {ViewEngine} viewEngine
 * @param {String} template  The template to render.
 */
function RenderView(viewEngine, template) {
  return middleware(req, next) {
    return next(req).then(function (renderOpts) {
      return viewEngine.respond(template, renderOpts);
    });
  };
}

module.exports = RenderView;
