exports.no = function(value) {
  return value === undefined || value === null;
};

exports.extractBody = function(jsgiReq) {
  return when(jsgiReq.input, function(input) {
    return require('querystring').parse(input);
  });
};

exports.extractSearch = function(jsgiReq) {
  return require('querystring').parse(jsgiReq.queryString);
};

exports.merge = function(target /*, sources */) {
  var
    sources = Array.prototype.slice.call(arguments),
    k,x;
  sources.shift();

  sources.forEach(function(source) {
    for (var k in source) {
      target[k] = source[k];
    }
  });

  return target;
};