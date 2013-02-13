<?php
require 'facebook.php';

function fbLogonLink() {
	global $fb_init;
	$facebook = new Facebook($fb_init);
	$fb_id = $facebook->getUser();


	if ($fb_id)
	{
				
		// We have a user ID, so probably a logged in user.
		// If not, we'll get an exception, which we handle below.
		try {
	
			$user_profile = $facebook->api('/me','GET');
			echo "Hi " . $user_profile['first_name'];
			$fbid = $user_profile['id'];
			$fbemail = isset($user_profile['email']) ? $user_profile['email'] : null;
			$fbname = $user_profile['first_name'];
			$fb_access_token = $facebook->getAccessToken();
			
			$sql1 = mysql_query("SELECT `uid` FROM users WHERE fbid=$fbid");
			if (!$sql1)
			{
				die('Error1: ' . mysql_error());
			}
			
			if (mysql_num_rows($sql1))
			{
				// facebook user is known, update the datestamp
				$sql2 = mysql_query("UPDATE users SET log=NOW(), user_token=\"$fb_access_token\" WHERE fbid=$fbid");
				if (!$sql2)
				{
					die('Error2: ' . mysql_error());
				}
				
				while($user = mysql_fetch_array($sql1))
				{
					$_SESSION['user_id'] = $user['uid'];
					$_SESSION['logged_id'] = true;
				}
			} else {
				// facebook user is unknown, add to users table
				$sql3 = mysql_query("INSERT INTO users(user_token, fbid, email, username, log) VALUES ('$fb_access_token', '$fbid', '$fbemail', '$fbname', NOW())"); // removed access token
				if (!$sql3)
				{
					die('Error3: ' . mysql_error());
				}
		
				$_SESSION['user_id'] = mysql_insert_id();
				$_SESSION['logged_id'] = true;
			}
	
		} catch(FacebookApiException $e) {
			// If the user is logged out, you can have a 
			// user ID even though the access token is invalid.
			// In this case, we'll get an exception, so we'll
			// just ask the user to login again here.
			$login_url = $facebook->getLoginUrl(); 
			echo 'Please <i class="icon-facebook-sign"></i> <a href="' . $login_url . '">login.</a>';
			error_log($e->getType());
			error_log($e->getMessage());
		}   
	
	}
	else
	{
	
		// No user, print a link for the user to login
		$login_url = $facebook->getLoginUrl();
		echo 'Please <i class="icon-facebook-sign"></i> <a href="' . $login_url . '">login.</a>';
	
	}

}


function fbUserEvents() {
	global $fb_init;
	$facebook = new Facebook($fb_init);
	$fb_id = $facebook->getUser();


	if ($fb_id)
	{
		
		// We have a user ID, so probably a logged in user.
		// If not, we'll get an exception, which we handle below.
		try {
	
			$user_events = $facebook->api('/me/events','GET');
			foreach ($user_events['data'] as $event) {
				echo '<div class="radio-item">';
					echo '<input type="radio" name="fbgroup" value="' . $event["id"] . '" id="fb' . $event["id"] . '" />';
					echo '<label for="fb';
						echo $event["id"];
						echo '">' . $event["name"] . '</label>';
				echo '</div>';
    		}
			
	
		} catch(FacebookApiException $e) {
			// If the user is logged out, you can have a 
			// user ID even though the access token is invalid.
			// In this case, we'll get an exception, so we'll
			// just ask the user to login again here.
			$login_url = $facebook->getLoginUrl(); 
			echo 'Please <i class="icon-facebook-sign"></i> <a href="' . $login_url . '">login to view your Facebook events.</a>';
			error_log($e->getType());
			error_log($e->getMessage());
		}   
	
	}
	else
	{
	
		// No user, print a link for the user to login
		$login_url = $facebook->getLoginUrl();
		echo 'Please <i class="icon-facebook-sign"></i> <a href="' . $login_url . '">login to view your Facebook events.</a>';
	
	}

}

?>