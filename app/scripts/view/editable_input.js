Multitasq.EditableInput = Backbone.View.extend({

    template: _.template(
        $("script.template-editable-input").html()
    ),

    parentSelector: ".editable-input",

    editing: false,

    events: {
        "click .editable":  "edit",
        "click .save":      "save",
        "click .cancel":    "close",
    },

    initialize: function(options) {
        this.task = options.task;
        this.render();
    },

    render: function() {
        // Create the template
        var template = this.template({title: this.task.get('title'), editing: this.editing});
        this.$el = $(this.parentSelector).html(template);

        // Set the events
        this.delegateEvents();

        return this;
    },

    // change to edit view
    edit: function() {
        this.editing = true;
        this.render();
        this.$el.find('input').get(0).select();
    },

    // change to normal view
    close: function() {
        this.editing = false;
        this.render();
    },

    // save the changes
    save: function() {
        this.task.save({'title': this.$el.find('input').val()});
        this.close();
    },
});
