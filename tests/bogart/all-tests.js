exports.testBogartApp = require("./app-tests");
exports.testEjs = require("./ejs-tests");

if (require.main == module.id)
    require("test/runner").run(exports);