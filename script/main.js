/*javascript*/
$(document).ready(function(){

	var jqxhr = $.get("/u")
	.success(function(data) {
		data = JSON.parse(data);
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
    $.ajax("/m", {
      type: "POST",
      data: params,
      success: function(data){
        location.reload();
      }
    });
  });
});
