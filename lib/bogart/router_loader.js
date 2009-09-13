var fs = require("file");
var sys = require("system");
var Bogart = require("bogart");

function RouterLoader(){
    this.rootPath = null;
    if (sys.env["BOGART_ROOT"])
        this.rootPath = sys.env["BOGART_ROOT"];
    else
        this.rootPath = fs.path(require.main).dirname();

    this.rootPath = new fs.Path(fs.join(this.rootPath, "app", "router"));
}

var routerRegExp = /_router.js$/;

/**
 * List routers that the RouterLoader has found in its path.
 */
RouterLoader.prototype.list = function(){
    var routerList = [];
    var contents = this.rootPath.list();
    for (var i=0;i<contents.length;++i){
        if (routerRegExp.test(contents[i]))
            routerList.push(contents[i]);
    }

    return routerList;
};

/**
 * Loads the routers into a Bogart.App
 */
RouterLoader.prototype.loadInto = function(app) {
    var routerFiles = this.list();
    for (var i=0;i<routerFiles.length;++i){
        var routerFile = routerFiles[i];
        var textRouter = fs.read(fs.join(this.rootPath, routerFile), { read: true });

        var router = eval(textRouter);

        app.addRouter("/" + routerFile.replace(routerRegExp, ""), router);
    }
};

exports.RouterLoader = RouterLoader;