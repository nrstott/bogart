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

/**
 * Taken under terms of the MIT license from: https://github.com/senchalabs/connect
 * Parse the given cookie string into an object.
 *
 * @param {String} str
 * @return {Object}
 * @api public
 */
exports.parseCookies = function(arg){
  var str = arg.headers && arg.headers.cookie ? arg.headers.cookie : arg;
  if(Object.prototype.toString.call(str) !== "[object String]") {
    return {};
  }
  var obj = {}
    , pairs = str.split(/[;,] */);
  for (var i = 0, len = pairs.length; i < len; ++i) {
    var pair = pairs[i]
      , eqlIndex = pair.indexOf('=')
      , key = pair.substr(0, eqlIndex).trim()
      , val = pair.substr(++eqlIndex, pair.length).trim();

    // quoted values
    if ('"' == val[0]) val = val.slice(1, -1);

    // only assign once
    if (undefined == obj[key]) {
      val = val.replace(/\+/g, ' ');
      try {
        obj[key] = decodeURIComponent(val);
      } catch (err) {
        if (err instanceof URIError) {
          obj[key] = val;
        } else {
          throw err;
        }
      }
    }
  }
  return obj;
};