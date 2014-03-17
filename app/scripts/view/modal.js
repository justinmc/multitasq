Multitasq.Modal = Backbone.View.extend({

    template: _.template(
        $("script.template-modal").html()
    ),

    parentSelector: ".modal",

    taskId: null,

    events: {
        "click .modal-background":      "close",
    },

    initialize: function() {
    },

    render: function(taskId) {
        this.taskId = taskId;

        // Create the template
        var template = this.template({title: 'ok'});
        this.$el = $(this.parentSelector).html(template);

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
    },

});
