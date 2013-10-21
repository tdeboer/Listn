$(document).ready (function() {

	if (featureSwitchEnabled('facebook-plugin')) {
		$('.fs-fb-plugin').show();
	}

	
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
	
	
	$('.facebook-login').click(function() {
		FB.login(function(response){
			if (response.authResponse) {
				// The person logged into your app
				storeUser(response);
			} else {
				// The person cancelled the login dialog
			}
		}, {scope: 'email,user_events,friends_events,publish_stream'});
	});
	
	
	$('.facebook-logout').click(function() {
		FB.logout(function(response) {});
	});
	
	
	function getCookie(c_name) {
		var i,x,y,ARRcookies=document.cookie.split(";");
		for (i=0;i<ARRcookies.length;i++) {
			x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
			y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
			x=x.replace(/^\s+|\s+$/g,"");
			if (x===c_name) {
				return unescape(y);
			}
		}
	}
	
	function setCookie(c_name,value,exdays) {
		var exdate=new Date();
		exdate.setDate(exdate.getDate() + exdays);
		var c_value=escape(value) + ((exdays===null) ? "" : "; expires="+exdate.toUTCString());
		document.cookie=c_name + "=" + c_value;
	}
	
	function featureSwitchEnabled(name) {
		if (getCookie(name) === 'enabled') return true;
		return false;
	}
	
	function featureSwitchDisabled(name) {
		if (getCookie(name) === 'disabled') return true;
		return false;
	}
	
	
 // end document.ready function.
});


function storeUser(response) {
	$.ajax({
		type: "POST",
		url: '/user/' + response.authResponse.userID,
		data: {token : response.authResponse.accessToken},
		success: function(data) {
			console.log(date);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log(errorThrown);
		}
	});
}