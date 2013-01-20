/* TODO:
 * OOP approach: playlist is object with options ( * Gather vars in one object. Functions > methods also?)
 * Make dialog flexible with simple templating system with php (require oid)
 * Make seperate js file for home
 * Make delete function
 * - bug when adding files together
- no facebook login plugin in safari
- check for updates earlier than on the switch
 * username is not visible
 * 
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
var dialogVisible = false;
var currentDialog;
var ytplayer;
var repeat;
var checkedUpdates = false;
var pl_width,pl_height,pl_scroll,pl_scroll2;

var settings = {
	autoplay: 1
}


/*
 * Youtube API
 */
function playYT() {
	if (needle < playlist.length) {
		console.log("Now playing: " + playlist[needle]);
		intervalScrubber = clearInterval(intervalScrubber);
		if (ytplayer) {
			ytplayer.loadVideoById( playlist[needle] );
		} else {
			console.log('Error: Youtube api not loaded!');
			setTimeout(
				function() { 
					//ytplayer.loadVideoById( playlist[needle] );
					onYouTubeIframeAPIReady();
				},
				500
			);
		}
		
		done = false;
		$( ".item.highlight" ).removeClass("highlight");
		$( ".item:eq(" + needle + ")" ).addClass("highlight");
		$('#playButton').children("i").removeClass('icon-play');
		$('#playButton').children("i").addClass('icon-pause');
	} else if (repeat) {
		needle = 0;
		playYT();
	}
}

function onYouTubeIframeAPIReady() {console.log('iFrame ready');
	//todo: stop autoplay for Modernizr.touch
	ytplayer = new YT.Player('player', {
		width: 425,
		height: 356,
		playerVars: {
			'autoplay': 0,
			'controls': 0,
			'rel': 0,
			'showinfo': 0,
			'enablejsapi': 1,
			'modestbranding': 1,
			'origin': 'http://www.bitesizedchunks.nl/',
			'wmode': 'opaque'
		},
		events: {
			'onReady': onPlayerReady,
			'onError': onytplayerError,
			'onStateChange': onytplayerStateChange
		}
    });
}

function onPlayerReady() {console.log('onreadycalled');
	if (playlist.length > 0) {
		playYT();
	}
}

function onYouTubePlayerReady(playerId) {
	console.log('Still used 3########');
	/*
		ytplayer = document.getElementById("myytplayer");
		ytplayer.addEventListener("onStateChange", "onytplayerStateChange");
		ytplayer.addEventListener("onError", "onytplayerError");
	*/
} 

function onytplayerStateChange(event) {
	playerState = event.data;
	console.log('Event: ' + event.data);
	if (event.data == 1) {
		intervalScrubber = clearInterval(intervalScrubber);
		intervalScrubber = setInterval("updateScrubber()", 200);
		$( "#slider-range-min" ).slider({ max: ytplayer.getDuration()*10 });
	} else if (event.data == 2) {
		intervalScrubber = clearInterval(intervalScrubber);
	} else if (event.data == 0 && !done) {
		intervalScrubber = clearInterval(intervalScrubber);
		done = true;
		needle++;
		checkUpdates(true);
	}
}

function onytplayerError(error) {
	console.log ("Error: " + error);
	if (error == 150 || error == 101 || error == 100) {
		// invalid file
		intervalScrubber = clearInterval(intervalScrubber);
		done = true;
		$(".item:eq(" + needle + ") > .icon-exclamation-sign").show();
		if(playlist.length >= 1) needle++;
		checkUpdates(true);
	}
}



function updateScrubber() {
	var pass = ytplayer.getPlayerState();
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
		if (current >= 60 && !checkedUpdates) {
			checkUpdates(false);
			checkedUpdates = true;
		}
	}
};



/*
 * Pubsub (faking)
 */
function checkUpdates(betweenSongs) {
	var hiddenTimestamp = $('#hidden-timestamp').val();
	var playlist_id = $('#hidden-pl').val();
	$.post("requests.php", {
		request: "check_update",
		pl_id: playlist_id
		},
		function (data) 
		{
			console.log("Current:" + hiddenTimestamp + " Update: " + data);
			if (data == hiddenTimestamp || hiddenTimestamp.length == 0) {
				console.log('No new files');
				if (betweenSongs) {
					playYT(); // TODO: extra check if there is something to play?
					checkedUpdates = false;
				}
			} else {
				// get the new files
				getUpdates(hiddenTimestamp, playlist_id, betweenSongs);
			}
		},
		"json");
}

function getUpdates(hiddenTimestamp, playlist_id, betweenSongs) {
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
				var date = data.posts[i].date;
				$('#userPlaylist').append( itemBlock(title, file, image, dur, contributor, date ) );
			}
			
			$('#hidden-timestamp').val(data.timestamp);
			//$.fn.lol();  //bug: breaks
			// Update plugins
			pl_scroll.tinyscrollbar_update();
			$("abbr.timeago").timeago();
			
			if (betweenSongs) {
				//TODO: inside onready scope
				playYT(); // TODO: extra check if there is something to play?
			}
		},
		"json");
}



function itemBlock(title, file, image, duration, contributor, date) {
	var itemMinutes = Math.floor( duration/60 );
	var itemSeconds = Math.ceil( duration%60 ) <  10 ? "0" + Math.ceil( duration%60 ) : Math.ceil( duration%60 );
	var itemDur = itemMinutes + ':' + itemSeconds;
	playlist.push(file);
	if(typeof image !== 'undefined' && image.length) {
		imageElement = '<img src="' + image + '" height="50" />';
	} else {
		imageElement = '';
	}
	return '<li class="item" id="' + file + '"><div class="image">' + imageElement + '</div><div class="text"><div class="dur">' + itemDur + '</div><div class="title">' + title + '</div><div class="comment">Added by ' + contributor + ' <abbr class="timeago" title="' + date + '">' + date + '</abbr></div></div><i class="icon-exclamation-sign" alt="Skipped"></i></li>';
}


function initScrollBar() {
	pl_width = $('#playlist').width();
    $('#scrollbar1').width(pl_width-6);
    $('#scrollbar1 > .viewport').width(pl_width-19);
    pl_height = $('#playlist').height();
    $('#scrollbar1 > .viewport').height(pl_height-12);
    pl_scroll = $('#scrollbar1');
    pl_scroll.tinyscrollbar({ invertscroll: true });
    pl_scroll2 = $('#scrollbar2');
    pl_scroll2.tinyscrollbar({ invertscroll: true });
    
    $(window).resize(function() {
		pl_width = $('#playlist').width();
		$('#scrollbar1').width(pl_width-6);
		$('#scrollbar1 > .viewport').width(pl_width-19);
		pl_height = $('#playlist').height();
		$('#scrollbar1 > .viewport').height(pl_height-12);
		pl_scroll.tinyscrollbar_update();
	});
}



  
$(document).ready (function() {
	throbber($('.overview'), 'show');
	
	/*
lol = function()
	{
		console.log('####lol function is used!####');
		pl_scroll.tinyscrollbar_update();
	};
*/
	
	function throbber(parent, toggle) {
		if (toggle == 'hide') {
			parent.find('.throbber').hide();
		} else if (toggle == 'show') {
			parent.find('.throbber').show();
		}
	}
	
	// geo location
	$("#placeInvite").live("click", initiate_geolocation);
	
	if (!Modernizr.touch){
		initScrollBar();
	}
	
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
			ytplayer.seekTo(ui.value /10,true);
		}
	});
    
        
    //TODO: still needed?
	if (playlist.length > 0) {
		console.log('###### Yes, still needed! ######');
		//playYT(); //test
	} 
	
	
	/*
	 * Ajax requests
	 */
	function addPlaylist(newTitle) {
		// TODO: What happens when you enter an existing name? -> error
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
		throbber($('.overview'), 'show');
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
	 			throbber( $('.overview'), 'hide' );
	 			// TODO: stop current video
	 			
				var songs = data.posts;
				for (var i = 0; i < songs.length; ++i) {
					var title = data.posts[i].title;
					var file = data.posts[i].file;
					var image = data.posts[i].image;
					var dur = data.posts[i].duration;
					var date = data.posts[i].date;
					var contributor = data.posts[i].user;
					$('#userPlaylist').append( $(itemBlock(title, file, image, dur, contributor, date )).css('visibility', 'hidden') );
				}
				
				// adjust scroll bar before setting items on display: none
				if (!Modernizr.touch){
					pl_scroll.tinyscrollbar_update();
				}
				$("abbr.timeago").timeago();
				
				$('.item').each(function(index) {
				    $(this).delay(400*index).hide().css('visibility', 'visible').fadeIn(300);
				});
				
				console.log(data.timestamp + "; " + data.playlist);
				$('#hidden-timestamp').val(data.timestamp);
				$('#hidden-pl').val(data.playlist);
				
				setSettings(data.playlist);

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
		// TODO bug: indexFile is -1
		// TODO: playlist crashes when first added file is corrupt
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
				$('#userPlaylist').append( $(itemBlock(d.title, d.file, d.image, d.dur, d.user, $.timeago(new Date()) )).hide().fadeIn(300) );
				
				setTimeout(
					function() { 
						pl_scroll.tinyscrollbar_update();
					},
					300
				);
				$("abbr.timeago").timeago();
				
				if (data.event) {
					var message = "added '" + d.title + "' to the playlist.";
					var url = 'https://graph.facebook.com/' + data.event + '/feed';
					$.post(url,
			     	{
			     		access_token: data.token,
			     		message: message,
			     		link: "http://www.bitesizedchunks.nl/ytapi/list.php?id=1",
			     		name: d.title + " on Listn.",
			     		caption: "'Frisse start' playlist on Listn.",
			     		description: "www.listn.nl",
			     		picture: d.image
			     	},
			     	function(fbdata) {
			     		console.log(fbdata.data);
			     	});
				}
				
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
		console.log('######Dit wordt nog gebruikt!!!!!######');
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
	
	
	function setSettings(playlist_id) {
		
		$.post("requests.php",
		{
			request: "settings",
			id: playlist_id
		},
		function (data) 
		{
			el = '#' + data.event_id;
			$(el).attr('checked', 'checked');
		},
		"json");
		
	}
	
	
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
	
	
	function connectEvent(eventId) {
		var playlist_id = $('#hidden-pl').val(); //TODO: make javascript var. As well for timestamp
		throbber($('#facebook-dialog'), 'show');
		$.post("requests.php", {
			request: "connect_event",
			pl_id: playlist_id,
			eventId: eventId
			},
			function (data) 
			{
				if (data.authenticated)
				{
					var message = "created playlist '" + data.title + "' for this event!";
					var url = 'https://graph.facebook.com/' + eventId + '/feed';
					$.post(url,
			     	{
			     		access_token: data.user_token,
			     		message: message,
			     		link: "http://www.bitesizedchunks.nl/ytapi/list.php?id=1",
			     		name: "Frisse start playlist on Listn.",
			     		caption: "Build your playlist together.",
			     		description: "www.listn.nl"
			     	},
			     	function(fbdata) {
			     		console.log(fbdata.data);
			     		throbber( $('#facebook-dialog'), 'hide' );
			     	});
				}
				else
				{
					notAuth(data.reason);
				}
			},
			"json");
	}
	
	
	
	
	
	/*
	 * Search
	 */
	function getYouTubeInfo(keyword) {
        $.ajax({
                url: "http://gdata.youtube.com/feeds/api/videos/?v=2&alt=json&q=" + keyword + "&max-results=20",
                dataType: "jsonp",
                success: function (data) { parseresults(data); }
        });
	}
	
	/*
$( ".input-prepend" ).focusout(function() {
		$('#results').hide();
	});
*/
	
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
			if (!Modernizr.touch) {
				pl_scroll2.tinyscrollbar_update();
			}
		}
	}
	
	$('.result').live('click', function () {
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
	
	$('#repeatButton').click(repeatToggle);
	
	$('#muteButton').click(muteToggle);
	
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
		event.preventDefault();
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
	
	$("#code, body").keyup(function(event) {
		if (event.keyCode == '27') { //escape key
			$('#results').hide();
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
	
	function muteToggle() {
		if( ytplayer.isMuted() ) {
			ytplayer.unMute();
			$('#muteButton').children("i").removeClass('icon-volume-off');
			$('#muteButton').children("i").addClass('icon-volume-up');
		} else if ( !ytplayer.isMuted() ) {
			ytplayer.mute();
			$('#muteButton').children("i").removeClass('icon-volume-up');
			$('#muteButton').children("i").addClass('icon-volume-off');
		}
	}
	
	function repeatToggle() {
		if( repeat ) {
			repeat = false;
			$('#repeatButton').removeClass('selected');
		} else if ( !repeat ) {
			repeat = true;
			$('#repeatButton').addClass('selected');
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
		/*
setTimeout(
			function() { 
				getPlaylist(idGET);
			},
			5000
		);
*/
		getPlaylist(idGET);
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
				console.log('Niet ingelogd');
			}
		}, 
		"json");
	}
	
	
	
	function notAuth(reason) {
		if (reason == "forbidden")
		{
			alert("This playlist is not public. Ask the admin of this playlist to invite you.");
		}
		else if (reason == "not admin")
		{
			alert("This playlist is not public. Ask the admin of this playlist to invite you.");
		}
		else
		{
			alert("For this you'll have to login");
			FB.login();
		}
	}
		
	
	
	/*
	 * Dialog
	 */
	$('#btn-new').click(function(e) {
		showDialog( $('#new-dialog') );
	});
	
	$('#new-confirm').click(function(e) {
		var valueTitle = $('#titlePlaylist').val();
		addPlaylist(valueTitle);
	});
	
	$('#btn-event').click(function(e) {
		showDialog( $('#facebook-dialog') );
	});
	
	$('#facebook-confirm').click(function(e) {
		var radioValue = $('#events-result .radio-item input:checked').val();
		console.log(radioValue);
		connectEvent(radioValue);
	});
	
	$('#btn-invite').click(function(e) {
		showDialog( $('#invite-dialog') );
	});
	
	$('#btn-settings').click(function(e) {
		showDialog( $('#settings-dialog') );
	});
	
	$('#logout').click(function(e) {
		FB.logout();
	});
	
	$('#account').click(function(e) {
		$.post("requests.php", {
			request: "destroy_session"
			},
			function (data) 
			{
				
			},
			"json");
	});
	
	$('.btn-hide-dialog').click(function() {
		showDialog();
	});
	
	
	function showDialog(el) {
		if (!dialogVisible) {
			
			el.show();
			currentDialog = el;
			// show dialog
			$('#manager, #dialog').stop().animate({
				left: '-=400px',
				right: '+=400px'
			}, 300);
			
			dialogVisible = true;
			
		} else {
			
			closeDialog(el);

		}
		
		function closeDialog(el) {
			$('#manager, #dialog').stop().animate({
				left: '+=400px',
				right: '-=400px'
			}, 300, function() {
				currentDialog.hide();
				if (el && currentDialog) {
					if (currentDialog.attr('id') != el.attr('id')) {
						showDialog(el);
					}
				}
			});
			
			dialogVisible = false;
		}
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


