/* TODO:
 * more OOP: playlist is object with options ( * Gather vars in one object. Functions > methods also?)
 * Make seperate js file for home, or not; what about caching benefits, i.e. isn't the file already loaded anyway?
 * 
 */
define(['youtube', 'socket', 'jqueryui', 'scrollbar', 'timeago'], function (YT, io) {



	var log = true;
	var playlist_data = {};
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
	};
	
	var socket = io.connect('http://listn.nl:3000'); //what if connection is denied? (i.e. Little Snitch)
	
	
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
						onPlayerReady();
					},
					500
				);
			}
			
			done = false;
			$( ".item.highlight" ).removeClass("highlight");
			$( ".item:eq(" + needle + ")" ).addClass("highlight");
			$('#playButton').children("i").removeClass('icon-play');
			$('#playButton').children("i").addClass('icon-pause');
			followCurrentItem();
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
				'origin': 'http://www.listn.nl/',
				'wmode': 'opaque'
			},
			events: {
				'onReady': onPlayerReady,
				'onError': onytplayerError,
				'onStateChange': onytplayerStateChange
			}
	    });
	}
	
	function onPlayerReady() {
		if (playlist.length > 0) {
			var start_item = $('.item.start');
			if (start_item.length > 0) {
				var video_id = start_item.data('video');
				needle = $.inArray(video_id, playlist);
			}
		}
		playYT();
	}
	
	function onytplayerStateChange(event) {
		playerState = event.data;
		console.log('Event: ' + event.data);
		if (event.data === 1) {
			intervalScrubber = clearInterval(intervalScrubber);
			intervalScrubber = setInterval(updateScrubber, 200);
			$( "#slider-range-min" ).slider({ max: ytplayer.getDuration()*10 });
		} else if (event.data === 2) {
			intervalScrubber = clearInterval(intervalScrubber);
		} else if (event.data === 0 && !done) {
			intervalScrubber = clearInterval(intervalScrubber);
			done = true;
			needle++;
			playYT();
		}
	}
	
	function onytplayerError(error) {
		console.log("Error: " + error);
		
		// invalid file
		intervalScrubber = clearInterval(intervalScrubber);
		done = true;
		$(".item:eq(" + needle + ") .dur").html('<i class="icon-exclamation-sign" alt="Skipped"></i>');
		$(".item:eq(" + needle + ") > .icon-remove-sign").show();
		if(playlist.length >= 1) needle++;
		playYT();
	}
	
	
	
	function updateScrubber() {
		var pass = ytplayer.getPlayerState();
		if (pass === 1) {
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
				//checkUpdates(false); EXPRESS
				checkedUpdates = true;
			}
		}
	};
	
	
	function followCurrentItem() {
		var view_height = $('#scrollbar1 .viewport').height();
		var top_current = $('#scrollbar1 .highlight').position().top;
		var item_height = $('#scrollbar1 .highlight').height();
		var list_height = $('#scrollbar1 .overview').height();
		var top_list = $('#scrollbar1 .overview').position().top;
		var new_current = top_current + top_list;

		if ( new_current > 0.8*view_height && top_current < list_height - view_height ) {
			pl_scroll.tinyscrollbar_update(top_current - 2*item_height);
		}
	}
		
	
	function initScrollBar() {
		pl_width = $('.playlist').width();
	    $('#scrollbar1').width(pl_width-6);
	    $('#scrollbar1 > .viewport').width(pl_width-19);
	    pl_height = $('.playlist').height();
	    $('#scrollbar1 > .viewport').height(pl_height-12);
	    pl_scroll = $('#scrollbar1');
	    pl_scroll.tinyscrollbar({ invertscroll: true });
	    pl_scroll2 = $('#scrollbar2');
	    pl_scroll2.tinyscrollbar({ invertscroll: true });
	    
	    $(window).resize(function() {
			pl_width = $('.playlist').width();
			$('#scrollbar1').width(pl_width-6);
			$('#scrollbar1 > .viewport').width(pl_width-19);
			pl_height = $('.playlist').height();
			$('#scrollbar1 > .viewport').height(pl_height-12);
			pl_scroll.tinyscrollbar_update();
		});
	}
	


	throbber($('.overview'), 'show');

	initApp();
	
	function initApp() {
		if (featureSwitchEnabled('settings')) {
			$('.fs-settings').show();
		}
		if (featureSwitchEnabled('facebook-plugin')) {
			$('.fs-fb-plugin').show();
		}
	
		$("abbr.timeago").timeago();
		$('#userPlaylist .item').each(function() {
			playlist.push( $(this).data('video') );	
		});
		
		onYouTubeIframeAPIReady();
		
		playlist_data.id = $('.playlist').attr('id');
		
		socket.on('connect', function () {
			console.log('connected socket');
			socket.emit('room', playlist_data.id);
		});
		
		socket.on('newItem', function(data) {
		   console.log('Incoming message:', data);

		   playlist.push($(data).data('video'));

		   $('#userPlaylist').append( $(data).hide().fadeIn(300) );
				
			setTimeout(
				function() { 
					pl_scroll.tinyscrollbar_update();
				},
				300
			);
			$("abbr.timeago").timeago();
			
			if (playlist.length === 1) {
				playYT();
			};
		});		
	}
	
	function throbber(parent, toggle) {
		if (toggle === 'hide') {
			parent.find('.throbber').hide();
		} else if (toggle === 'show') {
			parent.find('.throbber').show();
		}
	}
	
	if (!Modernizr.touch){
		initScrollBar();
	}


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
	
	
	/*
	 * Ajax requests
	 */
	function addPlaylist(newTitle) {
		
		$.ajax({
			type: "POST",
			url: '/playlist',
			data: {title : newTitle},
			success: function(data) {
				window.location = 'http://www.listn.nl/playlist/' + data.id;
			},
			error: function(jqXHR, textStatus, errorThrown) {
				notAuth(errorThrown);
			}
		});
		
	}
	
			
	function addFile(fileTitle, fileId, fileImg, fileDuration) {
		// TODO bug: indexFile is -1
		// TODO: playlist crashes when first added file is corrupt
		var indexFile = $.inArray(fileId, playlist),
			socketId = socket.socket.sessionid;
			
		$.ajax({
			type: "POST",
			url: window.location.pathname + "/item",
			data: {
				index: indexFile,
				file_name: fileTitle,
				file_id: fileId,
				image: fileImg,
				duration: fileDuration,
				source: "youtube",
				socket: socketId
			},
			success: function(data) {
				$('#code').val('').focus();	
			},
			error: function(jqXHR, textStatus, errorThrown) {
				notAuth(errorThrown);
			}
		});
		
	}
		
		
	function connectEvent(eventId, $button) {
		$.ajax({
			type: "PUT",
			data: {
				fb_event: eventId
			},
			success: function(html) {
				$('.fb-settings .message').text('Playlist connected to event').fadeIn().delay(7000).fadeOut();
				$('form#facebook').html(html);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				notAuth(errorThrown);
			}
		});
	}
	
	
	function disconnectEvent($button) {
		$.ajax({
			type: "DELETE",
			url: "/playlist/" + playlist_data.id + "/event",
			success: function(html) {
				$('.fb-settings .message').text('Playlist disconnected').fadeIn().delay(7000).fadeOut();
				$('form#facebook').html(html);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				notAuth(errorThrown);
			}
		});
	}
	
	
	$('#remove-button').click(function(){
		var conf = confirm("Are you sure you want to delete this playlist? \nThe playlist and all of its items will be deleted forever.");
		if (conf == true) {
			$.ajax({
				type: "DELETE",
				success: function(data) {
					window.location = '/';
				},
				error: function(jqXHR, textStatus, errorThrown) {
					notAuth(errorThrown);
				}
			});
		}
	});
	
	
	function getEvents(){
		$.ajax({
			type: "GET",
			url: "/playlist/" + playlist_data.id + "/events",
			success: function(html) {
				$('form#facebook').html(html);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				// notAuth(errorThrown);
			}
		});
	};
	
	
	$('#fb-login').click(function() {
		$.ajax({
			type: "GET",
			success: function(data) {
				console.log(data);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				console.log(errorThrown);
			}
		});
	});
	
	
	$('.item .icon-remove-sign').click(function() {
		var el = $(this).parents('.item'),
			item_id = el.attr('id'),
			video_id = el.data('video');
			
		$.ajax({
			type: "DELETE",
			url: "/playlist/" + playlist_data.id + "/item/" + item_id,
			success: function(data) {
				playlist.splice( $.inArray(video_id, playlist), 1 );
				el.remove();
			},
			error: function(jqXHR, textStatus, errorThrown) {
				notAuth(errorThrown);
			}
		});
	});
	
	
	
	
	
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

	
	$("#code").autocomplete({
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
		console.log(root);
		var feed = root.feed,
			entries = feed.entry || [],
			html = ['<ul>'];
			
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
			$('#search-result').append('<li class="result" id="' + idDirty + '"><img src="' + img + '" width="60" /><div class="caption">' + title + '</div></li>');
			$('#' + idDirty).data('fileData', { id: idClean, img: img, title: title, duration: duration });
			if (!Modernizr.touch) {
				pl_scroll2.tinyscrollbar_update();
			}
		}
	}
	
	$('#search-result').delegate('.result','click', function () {
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
	
	$('#userPlaylist').delegate('.item', 'click', function () {
		var gotoId = $(this).data('video');
		needle = $.inArray(gotoId, playlist);
		playYT();
	});
	
	$("body").keyup(function(event) {
		event.preventDefault();
		if ($(event.target).is(':not(input, textarea)')) {
			if (event.which === 32) {
				playPause();
			} else if (event.which === 38) {
				controlPrev();
			} else if (event.which === 40) {
				controlNext();
			} else if (event.which === 27) {
				$('#results').hide();
			}
		}
	});
	
	$("#code").keyup(function(event) {
		if (event.which === 27) { //escape key
			$('#results').hide();
		}
	});
	
	
	function playPause() {
		if( playerState === 1 ) {
			ytplayer.pauseVideo();
			$('#playButton').children("i").removeClass('icon-pause');
			$('#playButton').children("i").addClass('icon-play');
		} else if ( playerState === 2 ) {
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
	
	
	function notAuth(reason) {
		if (reason === "forbidden")
		{
			alert("This playlist is not public. Ask the admin of this playlist to invite you.");
		}
		else if (reason === "not admin")
		{
			alert("This playlist is not public. Ask the admin of this playlist to invite you.");
		}
		else if (reason === "Unauthorized")
		{
			alert("For this you'll have to login");
		}
		else
		{
			alert("Something went wrong");
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
	
	$('#btn-settings').click(function(e) {
		showDialog( $('#settings-dialog') );
		getEvents();
	});
	
	$('form#facebook').one('click', '#facebook-confirm', function(e) {
		var radioValue = $('#events-result input:checked').val();
		
		loadingFeedback($(this));
		connectEvent(radioValue, $(this));
	});
	
	$('.fb-settings').one("click", "#disconnect", function(e) {
		loadingFeedback($(this));
		disconnectEvent($(this));
	});
	
	$('#btn-invite').click(function(e) {
		showDialog( $('#invite-dialog') );
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
	
	
	function showDialog(el, btn) {
		if (!dialogVisible) {
			
			el.show();
			currentDialog = el;
			// show dialog
			$('#manager, #dialog').stop().animate({ // bug: fast open and closing shifts layout; fix left and right pixels in animation
				left: '-=292px',
				right: '+=292px'
			}, 600);
			
			if (btn) {
				btn.addClass('hover');
			}
			dialogVisible = true;
			
		} else {
			
			closeDialog(el);

		}
		
		function closeDialog(el) {
			$('#manager, #dialog').stop().animate({
				left: '+=292px',
				right: '-=292px'
			}, 600, function() {
				currentDialog.hide();
				if (el && currentDialog) {
					if (currentDialog.attr('id') != el.attr('id')) {
						showDialog(el);
					}
				}
				if (btn) {
					btn.removeClass('hover');
				}
			});
			
			dialogVisible = false;
		}
	}
	
	
	function loadingFeedback($el) {
		var actionText = $el.data('action');
		$el.addClass('loading').text(actionText);
	}
	
	
	$('.dialog-content .setting h3 i').on({
		click: function() {
			$(this).closest('.setting').find('.info').toggle();
		},
		mouseenter: function() {
			$(this).closest('.setting').find('.info').show();
		},
		mouseleave: function() {
			$(this).closest('.setting').find('.info').hide();
		}
	});
	
		
		
	/*
	 * Cookies
	 */
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
	
	
	return this;

});