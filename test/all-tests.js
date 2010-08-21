exports["router tests"]           = require("./router.test");
exports["view tests"]             = require("./view.test");
exports["response-helpers tests"] = require("./response-helpers.test");
exports["server tests"]           = require("./server.test");

if(require.main == module) {
  require("patr/runner").run(exports);
}