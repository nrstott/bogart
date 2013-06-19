var q = require('./q');

exports.join = function (forEachable) {
  var body = '';

  function appendChunk(chunk) {
    body += chunk;
  };

  return q.when(forEachable.forEach(appendChunk), function () {
    return body;
  });
};