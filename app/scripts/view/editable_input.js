Multitasq.EditableInput = Backbone.View.extend({

    template: _.template(
        $("script.template-editable-input").html()
    ),

    // passed in parent selector
    parentSelector: null,

    defaultValue: 'Click to edit',

    editing: false,

    events: {
        "click .editable":  "edit",
        "click .save":      "save",
        "click .cancel":    "close",
        "keyup .edit":      "inputKeyup",
    },

    initialize: function(options) {
        // Set passed in options
        this.task = options.task;
        this.attribute = options.attribute;
        this.parentSelector = options.parentSelector;

        // Change template if needed
        if (options.long) {
            this.template = _.template(
                $("script.template-editable-input-long").html()
            );
        }

        this.render();
    },

    render: function() {
        // Create the template
        var template = this.template({value: this.task.get(this.attribute), defaultValue: this.defaultValue, editing: this.editing});
        this.$el = $(this.parentSelector).html(template);

        // Set the events
        this.delegateEvents();

        return this;
    },

    // change to edit view
    edit: function() {
        this.editing = true;
        this.render();
        this.$el.find('.edit').get(0).select();
    },

    // change to normal view
    close: function() {
        this.editing = false;
        this.render();
    },

    // save the changes
    save: function() {
        var saveobj = {};
        saveobj[this.attribute] = this.$el.find('.edit').val();
        this.task.save(saveobj);
        this.close();
    },

    // handle keyup on input
    inputKeyup: function(event) {
        // on escape key, close
        if (event.which === 27) {
            this.close();

            // Stop propagation to prevent closing the modal
            event.stopPropagation();
        }
        // on enter key, save
        else if (event.which === 13) {
            this.save();

            // Stop propagation to prevent closing the modal
            event.stopPropagation();
        }
    }
});
