GET("/", function() {
    this.response.write("index");
    return this.response.finish();
});

GET("/new", function() {
    this.response.write("new");
    return this.response.finish();
});