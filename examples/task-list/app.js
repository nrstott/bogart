var
  bogart = require("bogart"),
  path   = require("path");

/**
 * Configuration function for the main bogart router of the site
 */
var site = function(get, post, put, del) {
  var 
    // Mustache view engine, templates are located in the "task-list/templates" directory
    viewEngine = bogart.viewEngine("mustache", path.join(__dirname, "templates")),
    
    // Tasks storage, replace with a database in a real application.
    tasks = {};
    
  
  get("/", function(req) {
    var
      errors = req.params.errors,
      taskList = [];
    
    // The template needs the tasks as an array, transform the tasks into an array
    for (var taskName in tasks) {
      taskList.push(tasks[taskName]);
    }
    
    // The index.html file is a mustache template located in the "templates" directory
    return viewEngine.respond("index.html", { locals: { tasks: taskList, errors: errors } });
  });
  
  post("/", function(req) {
    var
      task = { name: req.params.name, description: req.params.description },
      errors = [];
    
    if (!task.name || task.name.trim() === "") {
      errors.push("name is required");
    }
    
    // PRG pattern http://en.wikipedia.org/wiki/Post/Redirect/Get
    if (errors.length > 0) {
      return bogart.redirect("/?errors="+JSON.stringify(errors));
    }
    
    tasks[task.name] = task;
    
    return bogart.redirect("/");
  });
  
  del("/:name", function(req, name) {
    delete tasks[name];
    
    return bogart.redirect("/");
  });
};

var MethodOverride = bogart.middleware.MethodOverride;

// bogart#build adds parsing of JSON and form url-encoded middleware for the appropriate content-types
// This allows us to avoid the step of having to parse the form body for the create task post.
var app = bogart.build(function() {

  // Allow posts with a special hidden key of _method to have their logical method changed to a PUT or DELETE
  // This middleware is needed because some browsers do not natively support PUT and DELETE form actions
  this.use(MethodOverride);

  // Add a bogart.router to the jsgi application.
  // Analagous to instructing the result of bogart.router(site, ...optional another app...) to be added to the jsgi stack
  // If another this.use were present after the following one, it would become the 'nextApp' to this bogart#router
  this.use(bogart.router, site);
});

// Start the server
return bogart.start(app);
