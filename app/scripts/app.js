var Multitasq = (function() {

    Obj.prototype.sandbox = null;

    Obj.prototype.helpShown = false;

    // Constructor
    function Obj() {

        var that = this;

        $(function(){
            // create the router
            that.router = new MultitasqRouter();

            // create the main view
            that.sandbox = new Multitasq_Sandbox();
            that.createEvents();
        });
    }

    // Sets events
    Obj.prototype.createEvents = function() {

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
    Obj.prototype.helpShow = function() {
        this.sandbox.clear();
        $("#content_tasksvg").hide();
        $("#content_overlay").show();
        this.helpShown = true;
    };

    // Hide the help dialog and show the app
    Obj.prototype.helpHide = function() {
        this.sandbox.render();
        $("#content_tasksvg").show();
        $("#content_overlay").hide();
        this.helpShown = false;
    };

    return Obj;
})();

