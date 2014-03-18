Multitasq.Modal = Backbone.View.extend({

    template: _.template(
        $("script.template-modal").html()
    ),

    parentSelector: ".modal",

    task: null,

    events: {
        "click .modal-background":      "close",
    },

    initialize: function(options) {
        this.task = options.task;
        this.callback = options.callback;
        this.render();
    },

    render: function() {
        // Create the template
        var template = this.template({title: this.task.get('title'), description: this.task.get('description')});
        this.$el = $(this.parentSelector).html(template);
        
        // Create the subviews
        this.editTitle = new Multitasq.EditableInput({task: this.task});

        // Set the events
        this.delegateEvents();

        // Show the modal
        $(this.parentSelector).show();

        return this;
    },

    show: function() {
    },

    close: function() {
        this.remove();
        this.callback();
    },

});
