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

    render: function(text) {
        if (!this.text) {
            this.text = text;
        }

        // Create the template
        var template = this.template({text: this.text, editing: this.editing});
        this.$el = $(this.parentSelector).html(template);

        // Set the events
        this.delegateEvents();

        return this;
    },

    // change to edit view
    edit: function() {
        this.editing = true;
        this.render();
    },

    // change to normal view
    close: function() {
        this.editing = false;
        this.render();
    },

    // save the changes
    save: function() {
        this.text = this.$el.find("input").val();
        this.close();
    },
});
