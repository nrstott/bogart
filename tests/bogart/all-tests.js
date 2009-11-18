exports.testBogartApp = require("./app-tests");
exports.testEjs = require("./ejs-tests");
exports.testObservable = require("./observable/observable_tests");

if (require.main == module.id)
    require("test/runner").run(exports);