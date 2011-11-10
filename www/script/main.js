/*javascript*/
$(document).ready(function(){

  $(".topbar .dropdown-toggle").click(function(event){
    $(".secondary-nav .dropdown").toggleClass("open");
    console.log("click", $(".secondary-nav .dropdown"));
  });

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

	$("#searchBar").keyup(function(){
		searchBarSubmit();
	});

  $("#searchBar").click(searchBarSubmit); // fixes error with x button in chrome

});

function goTo(url){
  window.location = url;
}

/** Search Bar */
function searchBarSubmit() {
	var v = new Array(); // Array of search queries, separated by spaces. (ex. "Hello World" --> ["Hello","World"])
	v = $("#searchBar").val().toLowerCase().split(' '); // case insensitive
  var rows = $("#table tr");  // find rows. THIS WILL NO LONGER BREAK IF ANOTHER TABLE IS INTRODUCED :)

  if (v == ""){
    for (var i = 1; i < rows.length; i++){
      rows[i].style.display = "";
    }
  }

	for ( var i = 1; i < rows.length; i++ ) { // i is index of for loop 1
		var fullname = rows[i].innerHTML.toLowerCase(); // case insensitive

		for ( var k = 0; k < v.length; k++ ) {// k is the index of for loop 2
			var s = v[k]; // initialize search string s

			if (!(s == "" || s == " ")){
				if (fullname.search(s) == -1){ // -1 means the row does NOT contain the search string
					rows[i].style.display='none'; // hide row
					break;
				} else {
					rows[i].style.display = ''; // show row
				}
			}
		}
	}
}
