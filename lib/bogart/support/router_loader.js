var fs = require("file");
var sys = require("system");
var Bogart = require("bogart");
var Loader = require("./loader_base").Loader;

function RouterLoader(){
    this.rootPath = null;
    if (sys.env["BOGART_ROOT"])
        this.rootPath = sys.env["BOGART_ROOT"];
    else
        this.rootPath = fs.path(require.main).dirname();

    this.rootPath = new fs.Path(fs.join(this.rootPath, "app", "router"));
}

RouterLoader.prototype = new Loader("router");
RouterLoader.constructor = RouterLoader;

/**
 * Loads the routers into a Bogart.App
 */
RouterLoader.prototype.loadInto = function(app) {
    var routerFiles = this.list();
    for (var i=0;i<routerFiles.length;++i){
        var routerFile = routerFiles[i];
        var textRouter = fs.read(fs.join(this.rootPath, routerFile), { read: true });

        var router = eval(textRouter);

        app.addRouter("/" + routerFile.replace(/_router.js$/, ""), router);
    }
};

exports.RouterLoader = RouterLoader;