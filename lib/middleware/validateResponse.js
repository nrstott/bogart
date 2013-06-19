var q = require('../q')
  , middleware = require('../middleware');

/**
 * Validates that the response from nextApp is a valid JSGI response.
 * Rejects the promise if the response is invalid.
 *
 * @param {Function} nextApp  The next application in the JSGI chain.
 * @returns {Function} JSGI response.
 */
module.exports = middleware(function (req, nextApp) {
  return q.whenCall(function() { return nextApp(req); }, function(resp) {
    if (!resp) {
      return q.reject('Response must be an object.');
    }

    if (!resp.body) {
      return q.reject('Response must have a body property.');
    }

    if (!resp.body.forEach) {
      return q.reject('Response body must have a forEach method.');
    }

    if (typeof resp.body.forEach !== 'function') {
      return q.reject('Response body has a forEach method but the forEach method is not a function.');
    }

    if (!resp.status) {
      return q.reject('Response must have a status property.');
    }

    if (typeof resp.status.constructor !== '[Function: Number]') {
      return q.reject('Response has a status property but the status property must be a number.');
    }

    return resp;
  }, function(err) {
    // Workaround for fact that whenCall calls rejectCallback even if one is not provided.
    throw err;
  });
});