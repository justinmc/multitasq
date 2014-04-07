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
            created: this.task.getCreatedHuman(),
            updated: this.task.getUpdatedHuman(),
        }));
        $(this.parentSelector).html(this.$el);
        
        // Create the subviews
        this.editTitle = new Multitasq.EditableInput({task: this.task, attribute: 'title', parentSelector: '.editable-input.title'});
        this.editDescription = new Multitasq.EditableInput({task: this.task, attribute: 'description', parentSelector: '.editable-input.description', long: true});

        // Set the events
        this.delegateEvents();

        return this;
    },

    show: function() {
    },

    close: function() {
        $('body').off('keyup', this.keyupBound);
        this.app.router.navigate('');
        this.remove();
    },

    // Handle generic keyup
    keyup: function(event) {
        // if escape or enter, close
        if (event.which === 27 || event.which === 13) {
            this.close();
        }
    }

});
