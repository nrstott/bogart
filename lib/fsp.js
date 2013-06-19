// Promise-based file-system functions

var fs = require('fs')
  , q = require('./q');

exports.readFile = function (filePath) {
  var deferred = q.defer();

  fs.readFile(filePath, function(err, data) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(data);
    }
  });

  return deferred.promise;
}

exports.stat = function (fileOrFolderPath) {
  var deferred = q.defer();

  fs.stat(fileOrFolderPath, function(err, status) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(status);
    }
  });

  return deferred.promise;
}