// The main router
Multitasq.Router = Backbone.Router.extend({

    routes: {
        "":                     "main",    // root
        "help":                 "help",    // #help
        "leaf/:id":             "leaf",    // individual task
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

    leaf: function(id) {
        new Multitasq.Modal({
            task: this.app.sandbox.tasks.get(id),
            app: this.app,
        });
    }

});
