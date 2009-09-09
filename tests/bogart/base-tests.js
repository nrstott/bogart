var assert = require("test/assert");
var util = require("util");
var Bogart = require("bogart");

exports.testConstructorIsBogartBase = function(){
    var base = new Bogart.App();
    assert.isEqual(base.constructor,Bogart.App, "constructor of Bogart.Base() should be Bogart.Base, was '" + base.constructor + "'");
};

exports.testIsInstanceOfBogartBase = function() {
    var base = new Bogart.App();
    assert.isTrue(base instanceof Bogart.App, "constructed Bogart.Base should be instanceof Bogart.Base");
};