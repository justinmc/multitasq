Multitasq.Modal = Backbone.View.extend({

    template: _.template(
        $("script.template-modal").html()
    ),

    parentSelector: ".modal-view",

    task: null,

    events: {
        "click .modal-background":      "close",
        "click .close":                 "close",
        "keyup body":                   "keyup",
    },

    // Accepts the task to render for, and a callback to call when removing
    initialize: function(options) {
        this.task = options.task;
        this.callback = options.callback;

        // Rerender the view whenever the task changes
        var that = this;
        this.task.bind('change', function() {
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
            created: this.task.get('created'),
            updated: this.task.get('updated'),
        }));
        $(this.parentSelector).html(this.$el);
        
        // Create the subviews
        this.editTitle = new Multitasq.EditableInput({task: this.task, attribute: 'title', parentSelector: '.editable-input.title'});
        this.editDescription = new Multitasq.EditableInput({task: this.task, attribute: 'description', parentSelector: '.editable-input.description'});

        // Set the events
        this.delegateEvents();

        return this;
    },

    show: function() {
    },

    close: function() {
        $('body').off('keyup', this.keyupBound);
        this.remove();
        this.callback();
    },

    // Handle generic keyup
    keyup: function(event) {
        // if escape, close
        if (event.which === 27) {
            this.close();
        }
    }

});
