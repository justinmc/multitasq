var Multitasq = (function() {

    // object types
    Obj.Router = null;
    Obj.Sandbox = null;
    Obj.TaskView = null;
    Obj.TaskList = null;
    Obj.Task = null;

    Obj.prototype.sandbox = null;

    Obj.prototype.helpShown = false;

    // Constructor
    function Obj() {

        // Create the main view
        this.sandbox = new Obj.Sandbox(this);

        // Create the router
        this.router = new Obj.Router(this);
        Backbone.history.start({pushState: false});

        // Bind the events
        this.createEvents();
    }

    // Sets events
    Obj.prototype.createEvents = function() {

        var that = this;

        // help dialog toggle buttons
        $(".helpToggle").on("click", function(event) {
            if (that.helpShown) {
                that.router.navigate('', {trigger: true});
            }
            else {
                that.router.navigate('help', {trigger: true});
            }
            event.preventDefault(); 
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

