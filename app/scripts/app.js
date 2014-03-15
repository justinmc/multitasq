var Multitasq = (function() {

    Multitasq.prototype.sandbox = null;

    Multitasq.prototype.helpShown = false;

    // Constructor
    function Multitasq() {

        var that = this;

        $(function(){
            that.sandbox = new Multitasq_Sandbox();
            that.createEvents();
        });
    }

    // Sets events
    Multitasq.prototype.createEvents = function() {

        var that = this;

        // help dialog toggle buttons
        $(".helpToggle").on("click", function() {
            if (that.helpShown) {
                that.helpHide();
            }
            else {
                that.helpShow();
            }
        });
    };

    // Show the help dialog and hide the app
    Multitasq.prototype.helpShow = function() {
        this.sandbox.clear();
        $("#content_tasksvg").hide();
        $("#content_overlay").show();
        this.helpShown = true;
    };

    // Hide the help dialog and show the app
    Multitasq.prototype.helpHide = function() {
        this.sandbox.render();
        $("#content_tasksvg").show();
        $("#content_overlay").hide();
        this.helpShown = false;
    };

    return Multitasq;
})();

// Auto-initialize the app
new Multitasq();
