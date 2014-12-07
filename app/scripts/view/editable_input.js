Multitasq.EditableInput = Backbone.View.extend({

    template: _.template(
        $("script.template-editable-input").html()
    ),

    // passed in parent selector
    parentSelector: null,

    defaultValue: 'Click to edit',

    editing: false,

    // Is this a textarea?
    long: null,

    // True if ctrl or cmd keys are held
    ctrl: false,

    events: {
        "click .editable":  "edit",
        "click .save":      "save",
        "click .cancel":    "close",
        "keydown .edit":    "inputKeydown",
    },

    initialize: function(options) {
        // Set passed in options
        this.task = options.task;
        this.attribute = options.attribute;
        this.parentSelector = options.parentSelector;
        this.long = options.long;

        // Change template if needed
        if (this.long) {
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

        // Highlight the text if editing
        if (this.editing) {
            this.$el.find('.edit').get(0).select();
        }

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
        var saveobj = {};
        saveobj[this.attribute] = this.$el.find('.edit').val();
        this.task.save(saveobj);
        this.close();
    },

    // Handle keydown on input
    inputKeydown: function(event) {
        this.ctrl = event.ctrlKey || event.metaKey;

        // on escape key, close
        if (event.which === 27) {
            this.close();

            // Stop propagation to prevent closing the modal
            event.stopPropagation();
        }

        // on enter key, save
        else if (event.which === 13) {
          // If textarea, just use a normal enter
          if (!this.long || this.ctrl) {
            this.save();
          }

          // Stop propagation to prevent closing the modal
          event.stopPropagation();
        }
    }
});
