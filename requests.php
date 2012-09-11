<?php
	session_start();
	require_once 'config.php';
	
	//TODO get user id from backend (here) and strip it from js
	
	
	switch ($_POST['request'])
	{
	case "add_playlist":
		$response = array();
		if ( isset($_SESSION['logged_id']) && $_SESSION['logged_id'] == true )
		{
			$title = mysql_real_escape_string($_POST['title']);
			$id = $_SESSION['user_id'];
			$insert_pl = mysql_query("INSERT INTO playlists (title, admin_id) VALUES ('$title', '$id')");
			if (!$insert_pl)
			{
				die('Error1: ' . mysql_error());
			}
			
			$response['pl_id'] = mysql_insert_id();
			$response['authenticated'] = true;
		}
		else {
			$response['authenticated'] = false;
		}
		
		echo json_encode($response);
		mysql_close($con);
		break;
		
	case "get_playlist":
		//TODO: check if current user is allowed to see this playlist OR should it only be limited in actions?
		$playlist = $_POST['pl'];
		if ( isset($_SESSION['logged_id']) && $_SESSION['logged_id'] == true )
		{
			$id = $_SESSION['user_id'];
		}
		
		// get props of playlist
		$sql3 = mysql_query("SELECT * FROM playlists WHERE uid='$playlist' ");
		if (!$sql3) die('Error: ' . mysql_error());
		
		while($pl = mysql_fetch_array($sql3))
		{
			$public = $pl['public'];
			$admin = $pl['admin_id'];
			$time = $pl['date'];
			$title = $pl['title'];
		}
		
		// check access, when playlist is public the check isn't needed
		if ( $public==0 && $admin!==$id && isset($id) ) // is not admin but is logged in
		{
			$sql4 = mysql_query("SELECT * FROM participants WHERE pl_id='$playlist' AND user_id='$id' ");
			if (!$sql4) die('Error: ' . mysql_error());
			
			if (!mysql_num_rows($sql4)) // user is not a contributor
			{
				$response['authenticated'] = false;
				$response['reason'] = "forbidden";
				echo json_encode($response);
				mysql_close($con);
				break;
			}
		}
		else if ( $public==0 && !isset($id) ) // not logged in, don't know if user has access to playlist
		{
			$response['authenticated'] = false;
			echo json_encode($response);
			mysql_close($con);
			break;
		}
		
		// get the items belonging to the playlist
		$sql = mysql_query("SELECT * FROM files WHERE pl_id='$playlist' "); //orderby index
		if (!$sql) die('Error1: ' . mysql_error());
		
		$userArray = array();
		while($user = mysql_fetch_array($sql))
		{
			$userVal = $user['user_id'];
			if (!in_array($userVal, $userArray))
			{
				array_push($userArray, $userVal);
			}	
		}
		
		// get usernames of contributors
		$ids = join(',',$userArray);
		$sql2 = mysql_query("SELECT * FROM users WHERE uid IN ('$ids')");
		if (!$sql2) die('Error2: ' . mysql_error());
		
		while($u = mysql_fetch_array($sql2))
		{
			$id = $u['uid'];
			$id_name = $u['username'];
			$id_names = array($id=>$id_name);
		}
		
		// reset internal result pointer for first query for second iteration
		mysql_data_seek($sql, 0);
		// fill array with data form the playlist items. TODO: user_id is now username = confusing
		$response = array();
		$songs = array();
		while($file = mysql_fetch_array($sql))
		{
			$userIndex = $file['user_id'];
			if ($id_names[$userIndex])
			{
				$user_id = $id_names[$userIndex];
			}
			else 
			{
				$user_id = '';
			}
			$songs[] = array("id"=>$file['uid'], "index"=>$file['index'], "file"=>$file['file_id'], "title"=>$file['file_name'], "image"=>$file['image'], "duration"=>$file['duration'], "user"=>$user_id);
		}
		
		$response['authenticated'] = true;
		$response['timestamp'] = $time;
		$response['playlist'] = $playlist;
		$response['posts'] = $songs;
	
		echo json_encode($response);
		mysql_close($con);
		break;
		
	case "add_file":
		$response = array();
		if ( isset($_SESSION['logged_id']) && $_SESSION['logged_id'] == true )
		{	
			$a = $_POST['pl'];
			$id = $_SESSION['user_id'];
			$b = $_POST['index'];
			$c = mysql_real_escape_string($_POST['file_name']);
			$d = mysql_real_escape_string($_POST['file_id']);
			$e = mysql_real_escape_string($_POST['file_img']);
			$f = $_POST['file_dur'];
			$source = 'youtube';
			
			$sql="INSERT INTO `files`(`pl_id`, `user_id`, `index`, `file_id`, `file_name`, `source`, `duration`, `image`, `date`) VALUES ('$a','$id','$b','$d','$c','$source','$f','$e',NOW())";
			if (!mysql_query($sql,$con)) die('Error: ' . mysql_error());
			
			$sql2 = "UPDATE `playlists` SET `last_user_id`='$id', date=NOW() WHERE uid='$a'";
			if (!mysql_query($sql2, $con))
			{
				die('Error2: ' . mysql_error() . $a . "<br />" . $id);
			}
			
			$sql3 = mysql_query("SELECT username FROM users WHERE uid='$id' ");
			
			if (!$sql3)
			{
				die('Error: ' . mysql_error());
			}
			
			while($u = mysql_fetch_array($sql3))
			{
				$id_name = $u['username'];
			}
			  
			$object[] = array("title"=>$c, "file"=>$d, "image"=>$e, "dur"=>$f, "user"=>$id_name);
			$response['authenticated'] = true;
			$response['object'] = $object;
			mysql_close($con);
			
			
			/*

			while($file = mysql_fetch_array($sql))
		{
			$songs[] = array("id"=>$file['uid'], "index"=>$file['index'], "file"=>$file['file_id'], "title"=>$file['file_name']);
		}
		
		$sql2 = mysql_query("SELECT * FROM playlists WHERE uid='$playlist' ");
		
		if (!$sql2)
		  {
		  die('Error: ' . mysql_error());
		  }

		
		while($pl = mysql_fetch_array($sql2))
		{
			$time = $pl['date'];  
		}
		
		$response['timestamp'] = $time;
		$response['playlist'] = $playlist;
		$response['posts'] = $songs;
*/
		}
		else
		{
			$response['authenticated'] = false;
		}
		
		echo json_encode( $response );
		break;
		
	case "update_playlist":
		$title=$_POST['title'];
		$id=$_POST['title'];
		$insert_user=mysql_query("INSERT INTO playlists (title, user_id) VALUES ('$title', '$id')");
	 
		mysql_close($con);
		break;
	
	case "check_update":
		$playlist = $_POST['pl_id'];
		$sql2 = mysql_query("SELECT * FROM playlists WHERE uid='$playlist' ");
		
		if (!$sql2)
		  {
		  die('Error: ' . mysql_error());
		  }

		
		while($pl = mysql_fetch_array($sql2))
		{
			$time = $pl['date'];  
		}
		
		echo json_encode($time);
		mysql_close($con);
		break;
		
	case "get_update":
		$playlist = $_POST['pl_id'];
		$time = $_POST['time'];
		$sql = mysql_query("SELECT * FROM files WHERE pl_id='$playlist' AND date>'$time'");
		
		if (!$sql)
		  {
		  die('Error: ' . mysql_error());
		  }
				  
		$response = array();
		$songs = array();
		while($file = mysql_fetch_array($sql))
		{
			$songs[] = array("id"=>$file['uid'], "index"=>$file['index'], "file"=>$file['file_id'], "title"=>$file['file_name'], "image"=>$file['image'], "duration"=>$file['duration'], "user"=>"new");
		}
		
		$sql2 = mysql_query("SELECT * FROM playlists WHERE uid='$playlist' ");
		
		if (!$sql2)
		  {
		  die('Error: ' . mysql_error());
		  }

		
		while($pl = mysql_fetch_array($sql2))
		{
			$time = $pl['date'];  
		}
		
		$response['timestamp'] = $time;
		$response['playlist'] = $playlist;
		$response['posts'] = $songs;
	
		echo json_encode($response);
		mysql_close($con);
		break;
		
	case "invite_email":
		if ( isset($_SESSION['logged_id']) && $_SESSION['logged_id'] == true )
		{
			// TODO: disable button when clicked and enable with callback
			$playlist = $_POST['pl_id'];
			$email = $_POST['email'];
			$id = $_SESSION['user_id'];
			$token = md5(uniqid($playlist, true));
			$response = array();
			$token_query = mysql_query("INSERT INTO invite (token, email, pl_id) VALUES ('$token', '$email', '$playlist')");
			if (!$token_query)
			{
				die('Error1: ' . mysql_error());
			}
			mysql_close($con);
			
			// mail invitation
			$subject = "Invitation to contribute";
			$sender = $_SESSION['user_name'];
			$link = "http://www.bitesizedchunks.nl/ytapi/list.php?id=" . $playlist . "&token=" . $token;
			$message = $sender . " invited you to contribute to his/her playlist. Goto " . $link . " and login.";
			require_once 'mailform.php';
			
			$response['authenticated'] = true;
			$response['message'] = "Your invitation has been sent.";
			$response['email'] = $email;
		} else {
			$response['authenticated'] = false;
		}
		echo json_encode($response);
		break;
		
	case "add_participant":
		//TODO: how to check if url isn't given to someone else? add valid column to invite table?
		if ( isset($_SESSION['logged_id']) && $_SESSION['logged_id'] == true )
		{
			$response['authenticated'] = true;
			$id = $_SESSION['user_id'];
			$token = $_POST['token'];
			
			$sql = mysql_query("SELECT * FROM invite WHERE token='$token' ");
			if (!$sql)
			{
				die('Error1: ' . mysql_error());
			}
			while($u = mysql_fetch_array($sql))
			{
				$playlist = $u['pl_id'];
			}
			
			$sql2 = mysql_query("SELECT * FROM participants WHERE pl_id='$playlist' AND user_id='$id' ");
			if (!$sql2)
			{
				die('Error2: ' . mysql_error());
			}
			
			if (!mysql_fetch_array($sql2))
			{
				$sql3 = mysql_query("INSERT INTO participants(pl_id, user_id) VALUES ('$playlist', '$id')");
				if (!$sql3)
				{
					die('Error3: ' . mysql_error());
				}
			}
			
		}
		else
		{
			$response['authenticated'] = false;
		}
		
		echo json_encode($response);
		break;
	case "destroy_session":
		session_destroy();
		break;
		
	case "store_user":
		// TODO
		$response['authenticated'] = true;
		$fbid = $_POST['fbid'];
		$access_token = $_POST['access_token'];
		
		$sql1 = mysql_query("INSERT INTO users(user_token, fbid) VALUES ('$access_token', '$fbid') ON DUPLICATE KEY UPDATE fbid=fbid");
		if (!$sql1)
		{
			die('Error1: ' . mysql_error());
		}
		
		echo json_encode($response);
		break;
		
	default:
		echo "No request given";
	}
	
	session_write_close();
?> 