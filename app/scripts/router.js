// The main router
Multitasq.Router = Backbone.Router.extend({

    routes: {
        "":                     "main",    // root
        "help":                 "help",    // #help
        "task/:id":              "task",    // individual task
        "*path":                "main",    // all others
    },

    // Constructor - needs reference to app to change app on route change
    initialize: function(app) {
        this.app = app;
    },

    main: function() {
        this.app.helpHide();
    },

    help: function() {
        this.app.helpShow();
    },

    task: function(id) {
        this.app.sandbox.editTask(id);
    }

});
