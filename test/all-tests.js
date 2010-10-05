exports["test router"]           = require("./router.test");
exports["test view"]             = require("./view.test");
exports["test response-helpers"] = require("./response-helpers.test");
exports["test server"]           = require("./server.test");

if(require.main == module) {
  require("patr/runner").run(exports);
}
