var fsp = require('../fsp')
  , q = require('../q')
  , mimeType = require('../mimetypes').mimeType
  , path = require('path')
  , _ = require('underscore')
  , notFoundMessage = "404 Not Found"
  , nfLength = Buffer.byteLength(notFoundMessage)
  , response404 = {
      status: 404,
      body: [ notFoundMessage ],
      headers: {
        "content-length": nfLength
      }
    }
  ;

function respondWithFile(req, filePath, contentType, headers) {
  return q.when(fsp.stat(filePath), function (stat) {
    var etag, indexPath;

    if (!stat.isFile()) {
      if (stat.isDirectory()) {
        indexPath = path.join(filePath, "index.html");
        return respondWithFile(req, indexPath, contentType, headers);
      } else {
        return response404;
      }
    }

    headers = headers || {};

    if (typeof contentType === 'object') {
      headers = contentType;
      contentType = undefined;
    }
    
    contentType = mimeType(path.extname(filePath), contentType);

    etag = [stat.ino, stat.size, Date.parse(stat.mtime)].join("-");

    if (req.headers && req.headers["if-none-match"] === etag) {
      return {
        status: 304,
        body: [],
        headers: {}
      };
    }

    return q.when(fsp.readFile(filePath), function onSuccess(contents) {
      return {
        status: 200,
        headers: _.extend({
          etag: etag,
          "content-type": contentType
        }, headers),
        body: [contents]
      }
    });
  }, function(err) {
    if (err && err.code === 'ENOENT') {
      return response404;
    } else {
      throw err;
    }
  });
};  

module.exports = function directory(root, nextApp) {
  var opts;

  if (nextApp === undefined) {
    if (typeof root === 'function') {
      nextApp = root;
      root = undefined;
    } else {
      return function (nextApp) {
        return directory(root, nextApp);
      };
    }
  }

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

    return q.when(respondWithFile(req, reqPath, opts.headers), function(res) {
      if (res.status === 404 && nextApp) {
        return nextApp(req);
      } else {
        return res;
      }
    });
  };
};
