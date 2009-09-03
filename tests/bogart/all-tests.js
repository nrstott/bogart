exports.testBase = require("./base-tests");
exports.testBogartApp = require("./app-tests");
exports.testResource = require("./resource-tests");
exports.testEjs = require("./ejs-tests");
//exports.testDsl = require("./dsl-tests");

if (require.main == module.id)
    require("test/runner").run(exports);