<?php require_once 'config.php'; ?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>Listn</title>
<link rel="stylesheet" type="text/css" href="reset.css" />
<link rel="stylesheet" type="text/css" href="style.css" />
<link rel="stylesheet" type="text/css" href="font-awesome.css" />
<script type="text/javascript" src="http://code.jquery.com/jquery-1.8.1.min.js"></script>
<script type="text/javascript" src="jquery-ui-1.8.16.custom.min.js"></script>
<script type="text/javascript" src="jquery.tinyscrollbar1-81.min.js"></script>
<script type="text/javascript" src="playYT.js"></script>
</head>
	
<body>

	<?php require_once('/tpl-header.php'); ?>
		    
	    <div id="menu-bar">
	        <a id="btn-new" class="action unselectable"><i class="icon-plus"></i>New playlist</a>
	    </div>
	
	    <div id="manager">
	                
		     <div id="user-playlists">
		    	<h2>Your playlists</h2>
		        <?php
		            // user's playlists
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
	        	<h2>All playlists</h2> <!-- TODO: Other playlists: filter your own out -->
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

	
		<div id="dialog">
			<a id="btn-hide-dialog" class="unselectable"><i class="icon-signout"></i></a>
			<div id="dialog-wrapper">
				
				<div id="new-dialog" class="dialog-content">
					<h2>Create a new playlist</h2>
					<input type="text" name="titlePlaylist" id="titlePlaylist" />
					<a id="new-confirm" class="small awesome">Create</a>
					<div class="throbber"></div>
				</div>
				
				<div id="facebook-dialog" class="dialog-content">
					<h2>Connect your playlist to a facebook event</h2>
					<p>Your events:</p>
					<div id="events-result">
					<div class="radio-item"><input type="radio" name="fbgroup" value="whup" id="whup" /><label for="whup">Hopla</label></div>
					</div>
					<a id="facebook-confirm" class="small awesome">Connect</a>
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

</body>
</html>