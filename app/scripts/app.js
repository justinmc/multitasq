$(function(){
    // create the app
    var multitasq = new Multitasq_Sandbox();

    // help button listener
    $(".helpToggle").on("click", function() {
        if ($("#content_overlay").css("display") === "block") {
            multitasq.render();
            $("#content_tasksvg").show();
            $("#content_overlay").hide();
        }
        else {
            multitasq.clear();
            $("#content_tasksvg").hide();
            $("#content_overlay").show();
        }
    });
});
