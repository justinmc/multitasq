Multitasq.Modal = Backbone.View.extend({

    template: _.template(
        $("script.template-modal").html()
    ),

    parentSelector: ".modal",

    events: {
        "click .modal-background":      "close",
    },

    initialize: function() {
    },

    render: function() {
        var template = this.template();
        this.$el = $(this.parentSelector).html(template);
        this.delegateEvents();
        return this;
    },

    show: function() {
        $(this.parentSelector).show();
    },

    close: function() {
        console.log('close');
        $(this.parentSelector).hide();
    },

});
