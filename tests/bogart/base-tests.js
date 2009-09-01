var assert = require("test/assert");
var util = require("util");
var Bogart = require("bogart");

exports.testConstructorIsBogartBase = function(){
    var base = new Bogart.Base();
    assert.isEqual(base.constructor,Bogart.Base, "constructor of Bogart.Base() should be Bogart.Base, was '" + base.constructor + "'");
};

exports.testIsInstanceOfBogartBase = function() {
    var base = new Bogart.Base();
    assert.isTrue(base instanceof Bogart.Base, "constructed Bogart.Base should be instanceof Bogart.Base");
};