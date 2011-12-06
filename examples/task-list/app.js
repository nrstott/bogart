var bogart = require("../../lib/bogart")
  , path   = require("path");

// Mustache view engine, templates are located in the "task-list/templates" directory
var viewEngine = bogart.viewEngine("mustache", path.join(__dirname, "templates"));
    
// Tasks storage, replace with a database in a real application.
var tasks = {};
  
// Most Bogart applications will have a router. Router's generally contain the business logic
// for the application.
var router = bogart.router();

router.get("/", function(req) {
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
  
router.post("/", function(req) {
  var
      task = { name: req.params.name, description: req.params.description },
    errors = [];
  
  if (!task.name || task.name.trim() === "") {
    errors.push("name is required");
  }

  if (task.name && task.name.trim().indexOf(' ') !== -1) {
    errors.push('Task name may not have spaces');
  }
  
  // PRG pattern http://en.wikipedia.org/wiki/Post/Redirect/Get
  if (errors.length > 0) {
    return bogart.redirect("/?errors="+JSON.stringify(errors));
  }
  
  tasks[task.name] = task;
  
  return bogart.redirect("/");
});

router.del("/:name", function(req, name) {
  console.log('deleting '+req.params.name);
  console.log(tasks);
  delete tasks[name];
  
  return bogart.redirect("/");
});

// Create a Bogart Application. Application makes it easy for us to manage our JSGI appliances and routers.
var app = bogart.app();

// Frameworks are better when batteries are included. Put the batteries into this app!
app.use(bogart.batteries);

// Add our router to the app.  NOTE: It is important to add batteries first.
app.use(router);

// Start the server
app.start();
console.log("Task Server Started!");
