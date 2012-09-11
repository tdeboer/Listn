<?php require_once 'config.php'; ?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>List-n</title>
<link rel="stylesheet" type="text/css" href="style.css" />
<link rel="stylesheet" type="text/css" href="font-awesome.css" />
<script type="text/javascript" src="http://code.jquery.com/jquery-1.8.1.min.js"></script>
<script type="text/javascript" src="jquery-ui-1.8.16.custom.min.js"></script>
<script type="text/javascript" src="jquery.tinyscrollbar.min.js"></script>
<script type="text/javascript" src="playYT.js"></script>
</head>
	
<body>

	<div id="fb-root"></div>
	<script>
	  window.fbAsyncInit = function() {
	    FB.init({
	      appId      : '350892571642553', // App ID
	      channelUrl : 'http://www.bitesizedchunks.nl/ytapi/channel.php', // Channel File
	      status     : true, // check login status
	      cookie     : true, // enable cookies to allow the server to access the session
	      xfbml      : true  // parse XFBML
	    });
		
		FB.Event.subscribe('auth.statusChange',
		    function(response) {
		        console.log(response);

		         if (response.authResponse) {
		         	/* url = 'https://graph.facebook.com/' + response.authResponse.userID;
		         	$.getJSON(url,
		         	{
		         		access_token: response.authResponse.accessToken
		         	},
		         	function(data) {
		         		console.log(data);
		         	});
		         	*/
		         	$('#logout').show();
		         	
		         	// store user data
		         	$.post("requests.php", {
						request: "store_user",
						fbid: response.authResponse.userID,
						access_token: response.authResponse.accessToken
						},
						function (data) 
						{
							if (data.authenticated) {
								console.log("Stored user");
								// TODO: if new user > ask api for missing info
							}
						},
					"json");
		         }

		    }
		);
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
	        	<fb:login-button show-faces="true" width="200" max-rows="1" scope="user_events,publish_actions"></fb:login-button>
	        		<?php
	    				session_start();
	        			if ( isset($_SESSION['logged_id']) ) {
 							echo "<span id='account'>" . $_SESSION['user_name'] . "</span><br />";
	        			} else {
	        				echo "<span id='logout'>Login</span><br />";
	        			}
	        			session_write_close();
					?>
				<input type="hidden" id="hidden-pl" value="" />
				<input type="hidden" id="hidden-timestamp" value="" />
	        </div>
	
	    </div>
	    
	    <div id="menu-bar">
	        <!--  <a href="/ytapi" id="addPlaylist" class="small awesome"><i class="icon-home"></i>All playlists</a> -->
	        <a id="addPlaylist" class="small awesome"><i class="icon-plus"></i>New playlist</a>
	    </div>
	    
	    <div id="login-form">
	    	<div class="point-last">last used<div class="arrow-down"></div></div>
	    	
	    </div>
	    
	
	    <div id="home-manager">
	                
		     <div id="user-playlists">
		    	<h2>Your playlists</h2>
		        <?php
		            // all user playlists
					session_start();
					if ( isset($_SESSION['logged_id']) && $_SESSION['logged_id'] == true )
					{
						$userId = $_SESSION['user_id'];
			            $result = 	mysql_query("
		            				SELECT DISTINCT playlists.*
									FROM playlists
									INNER JOIN files
									ON playlists.uid=files.pl_id
									WHERE files.user_id='$userId'
									OR playlists.admin_id='$userId'
								");
			            $num_rows = mysql_num_rows($result);
					
			            if ($num_rows > 0) {
		    	        	echo "<ul>";
		        	        while($pls = mysql_fetch_array($result)) {
		            	            echo "<a href='list.php?id=" . $pls['uid'] . "'><li class='user-playlists list'>" . $pls['title'] . "</li></a>";
							}
							echo "</ul>";
		            	} else {
							echo "You don't have a playlist yet.";
						}
		            	$userId = $row[0];
					} else {
						echo "Log in to see your playlists.";	
					}
					session_write_close();
		        ?>
		    </div>
	                
	        <div id="all-playlists">
	        	<h2>All playlists</h2>
	            <?php
	                // all playlists TODO: where public==1
	                $result = mysql_query("
		                        	SELECT DISTINCT playlists.*
									FROM playlists
									INNER JOIN files
									ON playlists.uid=files.pl_id
	                ");
	                $num_rows = mysql_num_rows($result);
	
	                if ($num_rows > 0) {
	                	echo "<ul>";
	                    while($pls = mysql_fetch_array($result))
						{
							echo "<a href='list.php?id=" . $pls['uid'] . "'><li class='user-playlists list'>" . $pls['title'] . "</li></a>";
						}
	                    echo "</ul>";
					}
					$userId = $row[0];
	            ?>
			</div>
	        
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