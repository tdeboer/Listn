/* TODO:
 * OOP approach: playlist is object with options
 * Make dialog flexible with simple templating system with php (require oid) and make it a sidebar that slides in
 */

var playlist_id;
var playlist = [];
var params = { 
	allowScriptAccess: "always",
	wmode: "opaque"
};
var playerState; // unstarted (-1), ended (0), playing (1), paused (2), buffering (3), video cued (5)
var atts = {
	id: "myytplayer"
};
var needle = 0;
var stopScrubber = false;
var done;
var intervalScrubber;


/*
 * Youtube API
 */
function playYT() {
	/* use player.loadVideoById */
	console.log("now playing: " + playlist[needle]);
	$('#myytplayer').remove();
	intervalScrubber = clearInterval(intervalScrubber);
	$('#player > .padding').append('<div id="ytapiplayer" style="float:right"></div>');
	swfobject.embedSWF("http://www.youtube.com/e/" + playlist[needle] + "?enablejsapi=1&playerapiid=ytplayer&autoplay=1&controls=0&rel=0&showinfo=0", "ytapiplayer", "425", "356", "8", null, null, params, atts);
	done = false;
	$( ".item.highlight" ).removeClass("highlight");
	$( ".item:eq(" + needle + ")" ).addClass("highlight");
	$('#playButton').children("i").removeClass('icon-play');
	$('#playButton').children("i").addClass('icon-pause');
}

function onYouTubePlayerReady(playerId) {
	ytplayer = document.getElementById("myytplayer");
	ytplayer.addEventListener("onStateChange", "onytplayerStateChange");
	ytplayer.addEventListener("onError", "onytplayerError");
} 

function onytplayerStateChange(event) {
	playerState = event;
	console.log('event: ' + event);
	if (event == 1) {
		intervalScrubber = clearInterval(intervalScrubber);
		intervalScrubber = setInterval("updateScrubber()", 200);
		$( "#slider-range-min" ).slider({ max: ytplayer.getDuration()*10 });
	} else if (event == 2) {
		intervalScrubber = clearInterval(intervalScrubber);
	} else if (event == 0 && !done) {
		intervalScrubber = clearInterval(intervalScrubber);
		done = true;
		needle++;
		checkUpdates();
	}
}

function onytplayerError(error) {
	console.log ("Error: " + error);
	if (error == 150 || error == 101 || error == 100) {
		// invalid file
		intervalScrubber = clearInterval(intervalScrubber);
		done = true;
		$(".item:eq(" + needle + ") > .icon-exclamation-sign").show();
		needle++;
		checkUpdates();
	}
}



function updateScrubber() {
	var pass = ytplayer.getPlayerState( );
	if (pass == 1) {
		var duration = ytplayer.getDuration( );
		var durationMinutes = Math.floor( duration/60 );
		var durationSeconds = Math.ceil( duration%60 );
		var current = ytplayer.getCurrentTime();
		var currentMinutes = Math.floor( current/60 );
		var currentSeconds = Math.ceil( current%60 ) <  10 ? "0" + Math.ceil( current%60 ) : Math.ceil( current%60 );
		var progress = current/duration*100;
		if (!stopScrubber) {
			$('#slider-range-min').slider( "value", current*10 );
		}
		$('#marker-time').text(currentMinutes + ':' + currentSeconds);
		$('#total-time').text(durationMinutes + ':' + durationSeconds);
	}
};



/*
 * Pubsub (faking)
 */
function checkUpdates() {
	var hiddenTimestamp = $('#hidden-timestamp').val();
	var playlist_id = $('#hidden-pl').val();
	$.post("requests.php", {
		request: "check_update",
		pl_id: playlist_id
		},
		function (data) 
		{
			console.log("Current:" + hiddenTimestamp + " Update: " + data);
			if( data == hiddenTimestamp ) {
				console.log('no new files');
				playYT(); // extra check if there is something to play?
			} else {
				// get the new files
				getUpdates(hiddenTimestamp, playlist_id);
			}
		},
		"json");
}

function getUpdates(hiddenTimestamp, playlist_id) {
	// TODO: make default value of date current timestamp
	$.post("requests.php", {
		request: "get_update",
		pl_id: playlist_id,
		time: hiddenTimestamp
		},
		function (data) 
		{
			// append to playlist
			var songs = data.posts;
			for (var i = 0; i < songs.length; ++i) {
				var title = data.posts[i].title;
				var file = data.posts[i].file;
				var image = data.posts[i].image;
				var dur = data.posts[i].duration;
				var contributor = data.posts[i].user;
				$('#userPlaylist').append( itemBlock(title, file, image, dur, contributor) );
			}
			
			$('#hidden-timestamp').val(data.timestamp);
			$.fn.lol(); 
			//TODO: inside onready scope
			playYT(); // extra check if there is something to play?
		},
		"json");
}



function itemBlock(title, file, image, duration, contributor) {
	//console.log(image);
	var itemMinutes = Math.floor( duration/60 );
	var itemSeconds = Math.ceil( duration%60 ) <  10 ? "0" + Math.ceil( duration%60 ) : Math.ceil( duration%60 );
	var itemDur = itemMinutes + ':' + itemSeconds;
	playlist.push(file);
	if(typeof image !== 'undefined' && image.length) {
		imageElement = '<img src="' + image + '" height="50" />';
	} else {
		imageElement = '';
	}
	return '<li class="item" id="' + file + '"><div class="image">' + imageElement + '</div><div class="text"><div class="dur">' + itemDur + '</div><div class="title">' + title + '</div><div class="comment">Added by ' + contributor + '</div></div><i class="icon-exclamation-sign" alt="Skipped"></i></li>';
}




  
$(document).ready (function() {
	
	lol = function()
	{
		pl_scroll.tinyscrollbar_update();
	};
	
	// geo location
	$("#placeInvite").live("click", initiate_geolocation);
	
	function initiate_geolocation() {  
        //navigator.geolocation.getCurrentPosition(handle_geolocation_query,handle_errors);
		$.post("requests.php", {
			request: "user_events"
			},
			function (data) 
			{
				
			},
			"json");
    }  

	function handle_errors(error)  
    {  
        switch(error.code)  
        {  
            case error.PERMISSION_DENIED: alert("user did not share geolocation data");  
            break;  

            case error.POSITION_UNAVAILABLE: alert("could not detect current position");  
            break;  

            case error.TIMEOUT: alert("retrieving position timed out");  
            break;  

            default: alert("unknown error");  
            break;  
        }  
    }
	
    function handle_geolocation_query(position){  
        alert('Lat: ' + position.coords.latitude + ' ' +  
              'Lon: ' + position.coords.longitude);  
    } 
	

	
	/*
	 * GET parameters from url
	 */
	$.extend({
	  getUrlVars: function(){
	    var vars = [], hash;
	    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
	    for(var i = 0; i < hashes.length; i++)
	    {
	      hash = hashes[i].split('=');
	      vars.push(hash[0]);
	      vars[hash[0]] = hash[1];
	    }
	    return vars;
	  },
	  getUrlVar: function(name){
	    return $.getUrlVars()[name];
	  }
	});

	/* initialize ui elements */
	$( "#slider-range-min" ).slider({
		range: "min", 
		value: 0, 
		min: 1,
		max: 100, 
		start: function( event, ui ) {
			intervalScrubber = clearInterval(intervalScrubber);
		},
		slide: function( event, ui ) {
			ytplayer.seekTo(ui.value /10,false);
		},
		stop: function ( event, ui ) {
			console.log(ui.value);
			ytplayer.seekTo(ui.value /10,true);
		}
	});
    
    var pl_width = $('#playlist').width();
    $('#scrollbar1').width(pl_width-6);
    $('#scrollbar1 > .viewport').width(pl_width-19);
    var pl_height = $('#playlist').height();
    $('#scrollbar1 > .viewport').height(pl_height-12);
    var pl_scroll = $('#scrollbar1');
    pl_scroll.tinyscrollbar();
    var pl_scroll2 = $('#scrollbar2');
    pl_scroll2.tinyscrollbar();
    
    $(window).resize(function() {
		var pl_width = $('#playlist').width();
		$('#scrollbar1').width(pl_width-6);
		$('#scrollbar1 > .viewport').width(pl_width-19);
		var pl_height = $('#playlist').height();
		$('#scrollbar1 > .viewport').height(pl_height-12);
		pl_scroll.tinyscrollbar_update();
	});
	
    
    //TODO: still needed?
	if (playlist.length > 0) {
		playYT();
	} 
	
	
	/*
	 * Ajax requests
	 */
	function addPlaylist(newTitle) {
		// TODO: What happens when you enter an existing name?
		$.post("requests.php", {
			request: "add_playlist",
			title: newTitle
			},
			function (data) 
			{
				if (data.authenticated)
				{
					// playlist = [];
					console.log(data);
					playlist_id = data.pl_id;
					// TODO: getplaylist by submitting form
					// getPlaylist(playlist_id, hiddenId);
					window.location = 'http://www.bitesizedchunks.nl/ytapi/list.php?id=' + playlist_id;
				}
				else
				{
					notAuth();
				}
			},
			"json");
	}
	
	
	function getPlaylist(plid) {
		$.post("requests.php", 
		{
			request : "get_playlist", 
			pl: plid 
		},
		function (data) 
		{
			if (data.authenticated)
			{
		 		//empty playlist items
	 			$('#userPlaylist').children().remove();
	 			// TODO: stop current video
	 			
				var songs = data.posts;
				for (var i = 0; i < songs.length; ++i) {
					var title = data.posts[i].title;
					var file = data.posts[i].file;
					var image = data.posts[i].image;
					var dur = data.posts[i].duration;
					var contributor = data.posts[i].user;
					$('#userPlaylist').append( itemBlock(title, file, image, dur, contributor) );
				}
				
				console.log(data.timestamp + "; " + data.playlist);
				$('#hidden-timestamp').val(data.timestamp);
				$('#hidden-pl').val(data.playlist);
				
				if (playlist.length > 0) {
					playYT();
				} 
				
				pl_scroll.tinyscrollbar_update();
			}
			else
			{
				notAuth(data.reason);
			}
			
		},
		"json");
	} 
		
	function addFile(fileTitle, fileId, fileImg, fileDuration) {
		var playlist_id = $('#hidden-pl').val();
		//TODO bug: indexFile is -1
		var indexFile = $.inArray(fileId, playlist);
		$.post("requests.php",
		{
			request: "add_file",
			pl: playlist_id,
			index: indexFile,
			file_name: fileTitle,
			file_id: fileId,
			file_img: fileImg,
			file_dur: fileDuration
		}, 
		function (data) {
			if (data.authenticated)
			{
				// Focus on search field again
				$('#code').val('').focus();
				
				var d = data.object[0];
				$('#userPlaylist').append( itemBlock(d.title, d.file, d.image, d.dur, d.user) );
				pl_scroll.tinyscrollbar_update();
				if (playlist.length == 1) {
					playYT();
				};
			}
			else
			{
				notAuth();
			}
		}, 
			"json");
	}
	
	function updatePlaylist() {
		$.post("requests.php", 
		{
 			request: "update_playlist",
 			title: newTitle
 		},
 		function (data) 
 		{
			console.log('Playlist updated');
		}
	)};
	
	// moved from outside onready to here
	function emailInvite(recipient) {
		var playlist_id = $('#hidden-pl').val();
		$.post("requests.php", {
			request: "invite_email",
			pl_id: playlist_id,
			email: recipient
			},
			function (data) 
			{
				
			},
			"json");
	}
	
	
	
	/*
	 * Search Youtube 
	 */
	function getYouTubeInfo(keyword) {
        $.ajax({
                url: "http://gdata.youtube.com/feeds/api/videos/?v=2&alt=json&q=" + keyword + "&max-results=20",
                dataType: "jsonp",
                success: function (data) { parseresults(data); }
        });
	}
	
	$( ".input-prepend" ).focusout(function() {
		//$('#results').hide();
	});
	
	$( "#code" ).autocomplete({
	source: function( request, response ) {
		$.ajax({
			url: "http://gdata.youtube.com/feeds/api/videos/?v=2&alt=json&max-results=20",
			dataType: "jsonp",
			data: {
				q: request.term
			},
			success: function( data ) {
				parseresults(data);
			}
		});
	},
	minLength: 2
	});
	
	function parseresults(root) {
		var feed = root.feed;
		var entries = feed.entry || [];
		var html = ['<ul>'];
		$('#search-result').empty();
		$('#results').show();
		
		for (var i = 0; i < entries.length; ++i) {
			//TODO: handle no results
			var entry = entries[i];
			var title = entry.title.$t;
			var img = entry.media$group.media$thumbnail[0].url;
			var idClean = entry.media$group.yt$videoid.$t;
			var idDirty = idClean + 'search';
			var duration = entry.media$group.yt$duration.seconds;
			$('#search-result').append('<li class="result" id="' + idDirty + '"><img src="' + img + '" width="60" />' + title + '</li>');
			$('#' + idDirty).data('fileData', { id: idClean, img: img, title: title, duration: duration });
			pl_scroll2.tinyscrollbar_update();
		}
	}
	
	$('.result').live('click', function () {
		console.log('clicked result');
		var searchId = $(this).attr("id");
		var file = $('#' + searchId).data('fileData').id;
		var title = $('#' + searchId).data('fileData').title;
		var image = $('#' + searchId).data('fileData').img;
		var dur = $('#' + searchId).data('fileData').duration;
		addFile(title, file, image, dur);
		$("#results").hide();
	});
	
	

	/* 
	 * Controls
	 */
	$('#playButton').click(playPause);
	
	$('#prevButton').click(controlPrev);
	
	$('#nextButton').click(controlNext);
	
	$('#transitionButton, .button').mousedown(function(e) {
		$(this).addClass("selected");
	});
	
	$('.button').mouseup(function(e) {
		$(this).removeClass("selected");
	});
	
	$('.item').live('click', function () {
		var gotoId = $(this).attr('id');
		needle = $.inArray(gotoId, playlist);
		playYT();
	});
	
	$("body").keyup(function(event) {
		if ($(event.target).is(':not(input, textarea)')) {
			if (event.keyCode == '32') {
				playPause();
			}
			else if (event.keyCode == '37') {
				controlPrev();
			}
			else if (event.keyCode == '39') {
				controlNext();
			}
		}
	});
	
	function playPause() {
		if( playerState == 1 ) {
			ytplayer.pauseVideo();
			$('#playButton').children("i").removeClass('icon-pause');
			$('#playButton').children("i").addClass('icon-play');
		} else if ( playerState == 2 ) {
			ytplayer.playVideo();
			$('#playButton').children("i").removeClass('icon-play');
			$('#playButton').children("i").addClass('icon-pause');
		}
	}
	
	function controlNext() {
		if (playlist.length != 0 && needle + 1 != playlist.length) {
			needle++;
			playYT();
		}
	}
	
	function controlPrev() {
		if (playlist.length !=  0 && needle != 0 ) {
			needle--;
			playYT();
		}
	}
	
	
	
	/*
	 * GET variables
	 */
	// TODO: do this with php. e.g. require init.php
	var idGET = $.getUrlVar('id');
	if (typeof idGET != "undefined") {
		getPlaylist( idGET );
	}
	
	// TODO: what happens wih the getPlaylist when you are not yet a participant?
	var tokenGET = $.getUrlVar('token');
	if (typeof tokenGET != "undefined") {
		setToken( tokenGET );
	}

	function setToken(token) {
		$.post("requests.php",
		{
			request: "add_participant",
			token: token
		}, 
		function (data) {
			if (data.authenticated)
			{
				
			}
			else
			{
				console.log('niet ingelogd');
				// showDialog('logon');
			}
		}, 
		"json");
	}
	
	
	
	function notAuth(reason) {
		if (reason == "forbidden") {
			alert("This playlist is not public. Ask the admin of this playlist to invite you.");
		}
		else {
			alert("For this you'll have to login");
			FB.login();
		}
	}
		
	
	
	/*
	 * Dialog
	 */
	$('#addPlaylist').click(function(e) {
		showDialog('new playlist');
	});
	
	$('#invitePlaylist').click(function(e) {
		showDialog('invite to playlist');
	});
	
	$('#logout').click(function(e) {
		FB.logout();
	});
	
	$('#account').click(function(e) {
		//showDialog('account');
		$.post("requests.php", {
			request: "destroy_session"
			},
			function (data) 
			{
				
			},
			"json");
	});
	
	function showDialog(action) {
		switch (action)
		{
		case 'logon':
			var url = document.URL;
			console.log("ahahahaha");
			console.log(url);
			setCookie("orig_page", url, 1);
			
			var provider = getCookie("provider");
			switch (provider)
			{
			case 'provider_facebook':
				$('.point-last').css("margin-left","-14px");
				break;
			case 'provider_google':
				$('.point-last').css("margin-left","53px");
				break;
			case 'provider_hyves':
				$('.point-last').css("margin-left","119px");
				break;
			case 'provider_windowslive':
				$('.point-last').css("margin-left","184px");
				break;
			default:
				$('.point-last').hide();
			}
			var title = "Logon using your account from one of the websites below";
			var form = $('#login-form').html();
			break;
		case 'signup':
			console.log("Sign up");
			break;
		case 'new playlist':
			var title = "Create a new playlist";
			var form = '<input type="text" name="titlePlaylist" id="titlePlaylist" />';
			var submit = 	function() {
				var valueTitle = $('#titlePlaylist').val();
				addPlaylist(valueTitle);
				closeDialog();
			};
			break;
		case 'invite to playlist':
			var title = "Invite others to your playlist";
			var form = 	'<input id="publicInvite" type="checkbox" name="invite" value="public" /><label for="publicInvite">Public</label><br />';
				form +=  '<a id="placeInvite" class="small awesome"><i class="icon-map-marker"></i>Connect to this place</a><br />';
				form += '<label for="emailInvite">Invite someone by email</label><input type="text" name="email" id="emailInvite" /><br />';
				form +=  '<a id="getGeo" class="small awesome" style="display: none;"><i class="icon-map-marker"></i>Get location</a>';
			var submit = 	function() {
				var valueTitle = $('#emailInvite').val();
				emailInvite(valueTitle);
				closeDialog();
			};
			break;
		default:
			console.log("No action passed");
		}
		

		// prepare dialog
		$('#slide-dialog').show();
		$('#slide-dialog > .title').text(title);
		$('#slide-dialog > .input').html(form);
		var dialogHeight = ($('#slide-dialog').outerHeight()) * -1;
		$('#slide-dialog').css("top", dialogHeight);
		// show dialog
		$('#overlay').fadeIn(200);
		$('#slide-dialog').animate({top: '0'}, 200);
		
		if (submit) {
			$('#dialog-button').click(submit);
		} else {
			$('#dialog-button').hide();
		}
		
		function closeDialog() {
			$('#overlay').hide();
			$('#slide-dialog').hide();
			var dialogHeight = ($('#slide-dialog').outerHeight()) * -1;
			$('#slide-dialog').css("top", dialogHeight);
		}
		
		$('#overlay').click(function(e) {
			closeDialog();
		});
	}
	
		
		
	/*
	 * Cookies
	 */
	function getCookie(c_name)
	{
		var i,x,y,ARRcookies=document.cookie.split(";");
		for (i=0;i<ARRcookies.length;i++)
		{
			x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
			y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
			x=x.replace(/^\s+|\s+$/g,"");
			if (x==c_name)
			{
				return unescape(y);
			}
		}
	}
	
	function setCookie(c_name,value,exdays)
	{
		var exdate=new Date();
		exdate.setDate(exdate.getDate() + exdays);
		var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
		document.cookie=c_name + "=" + c_value;
	}

	
 // end document.ready function.
});


