Bogart.Router.extend("CatsRouter", function() {
    this.GET("/", function() {
        this.response.write("index");
        return this.response.finish();
    });

    this.GET("/new", function() {
        this.response.write("new");
        return this.response.finish();
    });
});