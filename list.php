<?php require_once('init.php'); ?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<title>Listn - <?php echo $settings['title'] ?></title>
	<link rel="stylesheet" type="text/css" href="reset.css" />
	<link rel="stylesheet" type="text/css" href="style.css" />
	<link rel="stylesheet" type="text/css" href="font-awesome.css" />
	<link href='http://fonts.googleapis.com/css?family=Anaheim' rel='stylesheet' type='text/css'>
	<script type="text/javascript" src="modernizr.js"></script>
	<script>
		var tag = document.createElement('script');
		tag.src = "//www.youtube.com/iframe_api";
		var firstScriptTag = document.getElementsByTagName('script')[0];
		firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
	</script>
	<script type="text/javascript" src="http://code.jquery.com/jquery-1.8.1.min.js"></script>
	<script src="//ajax.googleapis.com/ajax/libs/jqueryui/1.8.23/jquery-ui.min.js"></script>
	<!-- <script type="text/javascript" src="jQueryRotateCompressed.2.1.js"></script> -->
	<script type="text/javascript" src="jquery.tinyscrollbar1-81.min.js"></script>
	<script type="text/javascript" src="playYT.js"></script>
	<script type="text/javascript" src="timeago.js"></script>
</head>
	
<body>

	<div class="wrapper">

	    <div id="header-bar">
	    	
	    	<a class="button back" href="/">
		    	<i class="icon-th"></i>
	    	</a>
	    	
	        <div id="site-name">
	        	<h1>Listn - <?php echo $settings['title'] ?></h1>
	        </div>
	
	        <div id="log-state">      
				
				<?php fbLogonLink(); ?>

				<input type="hidden" id="hidden-pl" value="<?php echo $settings['uid'] ?>" />
				<input type="hidden" id="hidden-timestamp" value="<?php echo $settings['time'] ?>" />
				<input type="hidden" id="hidden-item" value="<?php if(isset($_GET['item'])) echo $_GET['item'] ?>" />
	        </div>
	        
	        <a id="btn-settings" class="button forward" href="#">
		    	<i class="icon-cog"></i>
	    	</a>
	        
	    </div>
    
	    <div id="menu-bar">
	        <a href="/" id="allPlaylist" class="action unselectable">
	        	<i class="icon-th"></i>
	        	<span class="caption">All playlists</span>
	        </a>
	        <a id="btn-new" class="action unselectable">
	        	<i class="icon-plus"></i>
	        	<span class="caption">New playlist</span>
	        </a>
	        <a id="btn-event" class="action unselectable">
	        	<i class="icon-facebook-sign"></i>
	        	<span class="caption">Event</span>
	        </a>
	        <!--
	        	<a id="btn-invite" class="action unselectable"><i class="icon-envelope"></i>Invite</a>
	        	<a id="btn-settings" class="action"><i class="icon-cog"></i>Settings</a>
			-->
	    </div>
    


		<div id="manager">

	        
		        <div id="search-field">
		        	<div class="input-prepend">
				    	<span class="add-on"><i class="icon-search"></i></span>
				    	<input id="code" class="span2" type="text" autofocus="autofocus" placeholder="Seach for more files to add" />
				    	<div class="list" id="results">
				    		<div id="scrollbar2">
								<div class="scrollbar"><div class="track"><div class="thumb"><div class="end"></div></div></div></div>
								<div class="viewport">
									<div class="overview">
										<div id="search-result"></div>
									</div>
								</div>
							</div>
				    	</div>
				    </div>
				</div>
	            
	            <div id="playlist">
                	<div id="scrollbar1">
						<div class="scrollbar"><div class="track"><div class="thumb"><div class="end"></div></div></div></div>
						<div class="viewport">
							<div class="overview">
								<div id="userPlaylist">
									<?php getFiles(); ?>
								</div>
							</div>
						</div>
					</div>
				</div>
				
				<div id="player"></div>
	    
	    <!-- end #manager -->
		</div>
		
		
		<div id="dialog">
		
			<a id="btn-hide-dialog" class="btn-hide-dialog button unselectable"><i class="icon-signout"></i></a>
			<div id="dialog-wrapper">
				
				<div id="new-dialog" class="dialog-content">
					<h2>Create a new playlist</h2>
					<label for="titlePlaylist">What should be the title of your new playlist?</label>
					<input type="text" name="titlePlaylist" id="titlePlaylist" />
					<div class="dialog-buttons">
						<a id="new-cancel" class="action btn-hide-dialog">
							<span class="caption">Cancel</span>
						</a>
						<a id="new-confirm" class="action">
							<span class="caption">Create</span>
						</a>
					</div>
					<div class="throbber"></div>
				</div>
				
				<div id="facebook-dialog" class="dialog-content">
					<h2>Connect your playlist to a facebook event</h2>
					<p>Your events:</p>
					<div id="events-result">
						<ul>
							<?php
								fbUserEvents();
							?>
						</ul>
					</div>
					<!-- <a id="facebook-confirm" class="small awesome">Connect</a> -->
					<div class="throbber"></div>
				</div>
				
				<div id="invite-dialog" class="dialog-content">
					<h2>Invite others to your playlist</h2>
					<label for="emailInvite">Invite someone by email</label><input type="text" name="email" id="emailInvite" /><br />
					<a id="dialog-button" class="small awesome">Invite</a>
				</div>
				
				<div id="settings-dialog" class="dialog-content">
					<h2>Settings</h2>
					<input id="publicInvite" type="checkbox" name="invite" value="public" /><label for="publicInvite">Public</label><br />
				</div>
				
			</div>
		<!-- end #dialog -->
		</div>
		
		
	</div>
	
	
	
    <div class="footer">
	    <div id="controls">
	        <div class="button unselectable" id="prevButton"><i class="icon-backward"></i></div>
	        <div class="button unselectable" id="playButton"><i class="icon-play"></i></div>
			<div class="button unselectable" id="nextButton"><i class="icon-forward"></i></div>
	        <div id="marker-time-wrapper" class="unselectable">
	        	<span id="marker-time">0:00</span>
	        </div>
	        <div id="slider-range-min" class="unselectable"></div>
	        <div id="total-time-wrapper" class="unselectable">
	        	<span id="total-time">0:00</span>
	        </div>
	        <div class="button unselectable" id="repeatButton"><i class="icon-repeat"></i></div>
	        <div class="button unselectable" id="muteButton"><i class="icon-volume-up"></i></div>
	        <!-- TODO: extra controls
	        <div class="toggle unselectable" id="transitionButton"><i class="icon-leaf"></i></div>
	        -->
	    </div>
	</div>
	
	
</body>
</html>