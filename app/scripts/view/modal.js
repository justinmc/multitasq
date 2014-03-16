Multitasq.Modal = Backbone.View.extend({

    tagName: "div",

    className: "modal",

    events: {
        "click .modal-background":      "close",
    },

    initialize: function() {
    },

    render: function() {
    },

    show: function() {
        $(this.className).show();
    },

    close: function() {
        $(this.className).hide();
    },

});
