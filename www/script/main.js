/*javascript*/
$(document).ready(function(){

	var jqxhr = $.get("/u", {
    _a: new Date().getTime()
  })
	.success(function(data) {
		$("#cool").tmpl(data).appendTo("#table");
	})
	.error(function() {
    console.error("unable to retrieve ranking");
	});
	
  $("#enterMatch").click(function(){
    var params = {
      winner: $("#winner").val(),
      winnerAuth: SHA256(SHA256($("#winnerAuth").val()) + $("#winner").val() + "/m"),
      loser: $("#loser").val(),
      loserAuth: SHA256(SHA256($("#loserAuth").val()) + $("#loser").val() + "/m")
    };

    $("#errors").empty();
    $(".error").removeClass("error");

    $.ajax("/m", {
      type: "POST",
      data: params,
      success: function(data){
        location.reload();
      },
      error: function(error){
        var response = JSON.parse(error.responseText);

        if (response.error > 100 && response.error < 200){
          $("#errors").append("<div id=\"submitError\" data-alert=\"error\" class=\"fade in alert-message error\">" + 
                              "<a class=\"close\" href=\"#\">x</a><p>" + response.msg +
                              "</p></div>");
          $("#submitError").alert();
          
          var inputIds = {
            101: "#winnerContainer",
            102: "#winnerPassContainer",
            103: "#loserContainer",
            104: "#loserPassContainer",
            105: "#loserContainer, #winnerContainer"
          }
          $(inputIds[response.error]).addClass("error");
        }
      }
    });
  });
});
