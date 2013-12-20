var _ = require('underscore');

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

exports.merge = _.extend;

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

/**
 * Ensures that the Set-Cookie header in the response is an array
 */
exports.ensureSetCookieArray = function(response) {
  response.headers = response.headers || {};

  response.headers["Set-Cookie"] = response.headers["Set-Cookie"] || [];
  if (Object.prototype.toString.call(response.headers["Set-Cookie"]) === "[object String]") {
    var existing = response.headers["Set-Cookie"];
    response.headers["Set-Cookie"] = [];
    response.headers["Set-Cookie"].push(existing);
  }
  
  return response;
};

function isOfMethod(method) {
  return function (req) {
    return req.method.toLowerCase() === method;
  }
}

exports.isOfMethod = isOfMethod;

/**
 * Returns whether a request is a get.
 *
 * @param {Request} req
 * @returns {Boolean}
 */
exports.isGet = isOfMethod('get');

/**
 * Returns whether a request is a post.
 *
 * @param {Request} req
 * @returns {Boolean}
 */
exports.isPost = isOfMethod('post');

/**
 * Returns whether a request is a put.
 *
 * @param {Request} req
 * @returns {Boolean}
 */
exports.isPut = isOfMethod('put');

/**
 * Returns whether a request is a delete.
 *
 * @param {Request} req
 * @returns {Boolean}
 */
exports.isDel = exports.isDelete = isOfMethod('delete');
