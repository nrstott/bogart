var fsp = require('../fsp')
  , q = require('../q')
  , mimeType = require('../mimetypes').mimeType
  , path = require('path')
  , _ = require('underscore');

function respondWithFile(req, filePath, contentType, headers) {
  headers = headers || {};

  if (typeof contentType === 'object') {
    headers = contentType;
    contentType = undefined;
  }
  
  contentType = mimeType(path.extname(filePath), contentType);

  return q.when(fsp.stat(filePath), function (stat) {
    var etag = [stat.ino, stat.size, Date.parse(stat.mtime)].join("-");

    if (req.headers && req.headers["if-none-match"] === etag) {
      return {
        status: 304,
        body: [],
        headers: {}
      };
    }

    return q.when(fsp.readFile(filePath), function onSuccess(contents) {
      return {
        "status": 200,
        "headers": _.extend({
          "etag": etag,
          "content-type": contentType
        }, headers),
        "body": [contents]
      }
    });
  });
};  

module.exports = function (root, nextApp) {
  var opts;

  if (typeof root === 'string') {
    opts = { root: root };
  } else if (typeof root === 'object') {
    opts = root;
  } else {
    opts = {};
  }

  opts.headers = opts.headers || {};

  return function (req) {
    var reqPath = path.join(opts.root, req.pathInfo.substring(1));

    return q.when(fsp.stat(reqPath), function(stat) {
      if (!stat) {
        return nextApp(req);
      } else if (stat.isFile()) {
        return respondWithFile(req, reqPath, opts.headers);
      } else {
        return nextApp(req);
      }
    }, function(err) {
      var notFoundMessage = "404 Not Found";

      return nextApp ? nextApp(req) : {
        "status": 404,
        "body": [ notFoundMessage ],
        "headers": {
          "content-length": Buffer.byteLength(notFoundMessage)
        }
      };
    });
  };
};