exports.parseJson = function(nextApp) {
  return function(req) {
    var
      contentType = req.headers['content-type'];
     
    if (contentType === "application/json") {
      return when(req.body.join(), function(body) {
        req.body = JSON.parse(body);
        
        return nextApp(req);
      });
    }
    
    return nextApp(req);
  }
};

exports.parseFormUrlEncoded = function(nextApp) {
  return function(req) {
    var contentType = req.headers['content-type'];
   
    if (contentType === 'application/x-www-form-urlencoded') {
      return when(req.body.join(), function(body) {
        req.body = require('querystring').parse(body);
        
        return nextApp(req);
      });
    }
    
    return nextApp(req);
  }
};
