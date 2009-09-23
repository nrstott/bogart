var sys = require("system");
var fs = require("file");

/**
 * Loads files by convention
 * @param usageType valid values are 'model', 'router', or 'service'
 */
function Loader(usageType){
    this.rootPath = null;
    if (sys.env["BOGART_ROOT"])
        this.rootPath = sys.env["BOGART_ROOT"];
    else
        this.rootPath = fs.path(require.main).dirname();

    this.rootPath = new fs.Path(fs.join(this.rootPath, "app", usageType));

    this.fileMatcher = new RegExp("_" + usageType + ".js$");
}

/**
 * List routers that the RouterLoader has found in its path.
 */
Loader.prototype.list = function(){
    var routerList = [];
    if (!fs.exists(this.rootPath)) {
        return [];
    }
    var contents = this.rootPath.list();
    for (var i=0;i<contents.length;++i){
        if (this.fileMatcher.test(contents[i]))
            routerList.push(contents[i]);
    }

    return routerList;
};

exports.Loader = Loader;