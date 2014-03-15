$(function(){
    // create the app
    var multitasq = new Multitasq_Sandbox();

    // help button listener
    $(".helpToggle").on("click", function() {
        if ($("#content_overlay").css("display") === "block") {
            history.pushState(null, "", "/");
            multitasq.render();
            $("#content_tasksvg").show();
            $("#content_overlay").hide();
        }
        else {
            history.pushState(null, "", "/help");
            multitasq.clear();
            $("#content_tasksvg").hide();
            $("#content_overlay").show();
        }
    });
});
