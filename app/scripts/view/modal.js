Multitasq.Modal = Backbone.View.extend({

    template: _.template(
        $("script.template-modal").html()
    ),

    parentSelector: ".modal-view",

    task: null,

    events: {
        "click .modal-background":      "close",
        "click .close":                 "close",
        "click .minimize":              "minimize",
        "click .maximize":              "maximize",
        "click .up":                    "up",
        "click .down":                  "down",
        "click .complete":              "complete",
        "click .restore":               "restore",
        "click .archive":               "archive",
        "keyup body":                   "keyup",
    },

    // Accepts the task to render for
    initialize: function(options) {
        this.app = options.app;
        this.task = options.task;

        // Rerender the view whenever the task changes
        var that = this;
        this.listenTo(this.task, 'change', function() {
            that.render();
        });

        this.keyupBound = this.keyup.bind(this);
        $('body').on('keyup', this.keyupBound);

        this.render();
    },

    render: function() {
        // Create the template
        this.$el = $(this.template({
            title: this.task.get('title'),
            description: this.task.get('title'),
            upped: this.task.get('upped'),
            minimized: this.task.get('minimized'),
            completed: !!this.task.get('completed'),
            childrenLength: this.task.get("children").length,
            top: this.task.get("parent") === -1,
            created: this.task.getCreatedHuman(),
            updated: this.task.getUpdatedHuman(),
        }));
        $(this.parentSelector).html(this.$el);
        
        // Create the subviews
        this.editTitle = new Multitasq.EditableInput({task: this.task, attribute: 'title', parentSelector: '.editable-input.title'});
        this.editDescription = new Multitasq.EditableInput({task: this.task, attribute: 'description', parentSelector: '.editable-input.description', long: true});

        // Start editing the title automatically if it's the default text
        if (this.task.get('title') === this.task.defaultTitle) {
            this.editTitle.editing = true;
            this.editTitle.render();
        }

        // Set the events
        this.delegateEvents();

        return this;
    },

    show: function() {
    },

    // Close the modal
    close: function() {
        $('body').off('keyup', this.keyupBound);
        this.app.router.navigate('');
        this.remove();
    },

    // Minimize the task
    minimize: function() {
        this.task.save({minimized: true});
        this.close();
    },

    // Maximize the task
    maximize: function() {
        this.task.save({minimized: false});
        this.close();
    },

    // 'up' the task
    up: function() {
        this.task.save({upped: true});
        this.close();
    },

    // 'down' the task
    down: function() {
        this.task.save({upped: false});
        this.close();
    },

    // complete the task
    complete: function() {
        this.task.setCompletedSubtree();
        this.close();
    },

    // restore the task
    restore: function() {
        this.task.setIncompleteSubtree();
        this.close();
    },

    // archive the task
    archive: function() {
        this.task.setArchivedSubtree();
        this.close();
    },

    // Handle generic keyup
    keyup: function(event) {
        // if escape or enter, close
        if (event.which === 27 || event.which === 13) {
            this.close();
        }
    }

});
