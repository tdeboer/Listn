<?php 
//require_once 'init.php';

function isAdmin($id) {
	// TODO: for real
	return true;
}
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>List-n</title>
<link rel="stylesheet" type="text/css" href="style.css" />
<link rel="stylesheet" type="text/css" href="font-awesome.css" />
<script type="text/javascript" src="http://code.jquery.com/jquery-1.8.1.min.js"></script>
<script type="text/javascript" src="jquery-ui-1.8.16.custom.min.js"></script>
<!-- <script type="text/javascript" src="jQueryRotateCompressed.2.1.js"></script> -->
<script type="text/javascript" src="jquery.tinyscrollbar.min.js"></script>
<script type="text/javascript" src="playYT.js"></script>
<script type="text/javascript" src="swfobject.js"></script>
</head>
	
<body>

	<div id="fb-root"></div>
	<script>
	  window.fbAsyncInit = function() {
	    FB.init({
	      appId      : '350892571642553', // App ID
	      channelUrl : 'http://www.bitesizedchunks.nl/ytapi/channel.html', // Channel File
	      status     : true, // check login status
	      cookie     : true, // enable cookies to allow the server to access the session
	      xfbml      : true  // parse XFBML
	    });
	
	    // Additional initialization code here
	    FB.login();
	  };
	
	  // Load the SDK Asynchronously
	  (function(d){
	     var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
	     if (d.getElementById(id)) {return;}
	     js = d.createElement('script'); js.id = id; js.async = true;
	     js.src = "//connect.facebook.net/en_US/all.js";
	     ref.parentNode.insertBefore(js, ref);
	   }(document));
	</script>

	<div class="wrapper">

	    <div id="header-bar">
	    	
	        <div id="site-name">
	        	<h1>List-n</h1>
	        </div>
	
	        <div id="log-state">	        

	        		<?php
// 	    				include('config.php');
						
// 						if(isset($_COOKIE['username']))
// 						{
// 							$user = $_COOKIE['username'];
// 							echo "Hi " . $user . ".<br />";
// 							echo "<a href='logout.php'>Logout</a>";
							
// 							$query=mysql_query("SELECT uid FROM users where username='$user' ");
// 							$row = mysql_fetch_row($query);
// 							$userId = $row[0];
// 							echo "<input id='hidden-id' type='hidden' value='" . $userId . "' />";
// 							$loggedIn = true;
// 						}
// 						else
// 						{
	        			session_start();
	        			if ( isset($_SESSION['logged_id']) ) {
 							echo "<span id='account'>" . $_SESSION['user_name'] . "</span><br />";
	        			} else {
	        				echo "<span id='login'>Login</span><br />";
	        			}
	        			session_write_close();
// 							echo "<a href='signup.php'>Signup</a>";
// 							$loggedIn = false;
// 						}
						
					?>
				<input type="hidden" id="hidden-pl" value="" />
				<input type="hidden" id="hidden-timestamp" value="" />
	        </div>
	        
	    </div>
    
    
	    <div id="menu-bar">
	        <a href="/ytapi" id="allPlaylist" class="small awesome"><i class="icon-home"></i>All playlists</a>
	        <a id="addPlaylist" class="small awesome"><i class="icon-plus"></i>New playlist</a>
	        <?php if ( isAdmin($_GET['id']) == true ) {
	        	echo '<a id="invitePlaylist" class="small awesome"><i class="icon-plus"></i>Invite</a>';
	        } ?>
	    </div>

	    
	    <div id="login-form">
	    	<div class="point-last">last used<div class="arrow-down"></div></div>

	    </div>
    

		<div id="manager">
	        
		        <div id="search-field">
		        	<div class="input-prepend">
				    	<span class="add-on"><i class="icon-search"></i></span>
				    	<input id="code" class="span2" type="text" autofocus="autofocus" placeholder="Add more files to this playlist" />
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
	        
	            <div id="player">
	            	<div class="padding">
						<div id="ytapiplayer"></div>
		                <div style="width:430px; height:356px; position:relative; display:none;">
		                    <img src="gfx/ajax-loader.gif" />
		                </div>
					</div>
	            </div>
	            
	            <div id="playlist">
	                	<div id="scrollbar1">
							<div class="scrollbar"><div class="track"><div class="thumb"><div class="end"></div></div></div></div>
							<div class="viewport">
								<div class="overview">
									<div id="userPlaylist">
									
									</div>
								</div>
							</div>
						</div>
				</div>
	        
		</div>
	</div>
	
	
    <div class="footer">
	    <div id="controls">
	        <div class="button" id="prevButton"><i class="icon-backward"></i></div>
	        <div class="button" id="playButton"><i class="icon-play"></i></div>
			<div class="button" id="nextButton"><i class="icon-forward"></i></div>
	        <div id="marker-time-wrapper">
	        	<span id="marker-time">0:00</span>
	        </div>
	        <div id="slider-range-min"></div>
	        <div id="total-time-wrapper">
	        	<span id="total-time">0:00</span>
	        </div>
	        <!-- TODO
	        <div class="toggle" id="transitionButton"><i class="icon-leaf"></i></div>
	        <div class="button" id="fullscreenButton"><i class="icon-resize-full"></i></div>
	        <div class="button" id="volumeButton"><i class="icon-volume-up"></i></div>
	        -->
	    </div>
	</div>

	<div id="overlay"></div>
	<div id="slide-dialog">
		<h2 class="title"></h2>
		<div class="input"></div>
		<a id="dialog-button" class="small awesome">Go</a>
	</div>
	
</body>
</html>