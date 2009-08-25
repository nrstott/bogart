this.exports = exports || {};
exports.testBogartApp = require("./app-tests");
exports.testDsl = require("./dsl-tests");

if (require.main == module.id)
    require("test/runner").run(exports);