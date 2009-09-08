exports.testLog = require("./log/all-tests");

if (require.main == module.id)
    require('test/runner').run(exports);