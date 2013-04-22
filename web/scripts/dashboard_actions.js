$(document).ready (function() {

	
	function newPlaylist(newTitle) {
		$.post("requests.php", {
			request: "add_playlist",
			title: newTitle
			},
			function (data) 
			{
				if (data.authenticated)
				{
					window.location = 'http://www.listn.nl/list.php?id=' + data.pl_id;
				}
				else
				{
					alert("For this you'll have to login");
				}
			},
			"json");
	}
	
	
	$('#btn-new').click(function() {
		newPlaylist( $('#titlePlaylist').val() );
	});
	
	
 // end document.ready function.
});