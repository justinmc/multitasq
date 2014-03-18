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
        "keypress input":   "inputKeypress",
        "keyup input":      "inputKeyup",
    },

    initialize: function(options) {
        this.task = options.task;
        this.callback = options.callback;
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

    // handle keypress on input
    inputKeypress: function(event) {
        // on enter key, save
        if (event.which === 13) {
            this.save();
        }
    },

    // handle keyup on input
    inputKeyup: function(event) {
        // on escape key, close
        if (event.which === 27) {
            this.close();
        }
    }
});
