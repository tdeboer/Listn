<?php
	
	require_once 'config.php';
	
	
	function drawItem($response) {
		foreach ($response['posts'] as $file)
		{
			$itemMinutes = floor( $file['duration']/60 );
			$itemSeconds = ceil( $file['duration']%60 ) <  10 ? "0" . ceil( $file['duration']%60 ) : ceil( $file['duration']%60 );
			$itemDur = $itemMinutes . ':' . $itemSeconds;
			
			$block = '<li class="item" id="';
			$block .= $file['file'];
			$block .= '"><div class="image">';
			$block .= '<img src="';
			$block .= $file['image'];
			$block .= '" height="50" />';
			$block .= '</div><div class="text"><div class="dur">';
			$block .= $itemDur;
			$block .= '</div><div class="title">';
			$block .= $file['title'];
			$block .= '</div><div class="comment">Added by ';
			$block .= $file['user'];
			$block .= ' <abbr class="timeago" title="';
			$block .= $file['date'];
			$block .= '">';
			$block .= $file['date'];
			$block .= '</abbr></div></div><i class="icon-exclamation-sign" alt="Skipped"></i></li>';
			echo $block;
			//var_dump($file);
		}
	}

	
	function getPlaylist() {
		global $settings, $con;
		$playlist = $_GET['id'];
		
		if (isset($playlist))
		{
		
			$sql1 = mysql_query("SELECT * FROM playlists WHERE uid='$playlist'");
			
			if (!$sql1)	
			{
				die('Error: ' . mysql_error());
			}
			
			while($pl = mysql_fetch_array($sql1))
			{
				$settings['uid'] = $playlist;
				$settings['public'] = $pl['public'];
				$settings['admin'] = $pl['admin_id'];
				$settings['time'] = $pl['date'];
				$settings['title'] = $pl['title'];
			}
		}
		else
		{
			echo "No playlist specified";
		}
	}
	
	
	function getFiles() {
		global $settings;
		$playlist = $_GET['id'];
		
		if ( isset($_SESSION['logged_id']) && $_SESSION['logged_id'] == true )
		{
			$id = $_SESSION['user_id'];
		}
		
		// check access, when playlist is public the check isn't needed
		if ( $settings['public']==0 && $settings['admin']!==$id && isset($id) ) // is not admin but is logged in
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
		else if ( $settings['public']==0 && !isset($id) ) // not logged in so don't know if user has access to playlist
		{
			$response['authenticated'] = false;
			echo json_encode($response);
			mysql_close($con);
			break;
		}
		
		// get the items belonging to the playlist
		$sql = mysql_query("SELECT * FROM files WHERE pl_id='$playlist' ORDER BY uid DESC");
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
		$ids = join("','",$userArray);
		$sql2 = mysql_query("SELECT * FROM users WHERE uid IN ('$ids')");
		if (!$sql2) die('Error2: ' . mysql_error());
		
		$id_names = array();
		while($u = mysql_fetch_array($sql2))
		{
			$id = $u['uid'];
			$id_name = $u['username'];
			$id_names[$id] = $id_name;
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
			$songs[] = array(
						"id"=>$file['uid'],
						"index"=>$file['index'],
						"file"=>$file['file_id'],
						"title"=>$file['file_name'],
						"image"=>$file['image'],
						"duration"=>$file['duration'],
						"date"=>$file['date'],
						"user"=>$user_id
					);
		}
		
		$response['authenticated'] = true;
		$response['timestamp'] = $settings['time'];
		$response['playlist'] = $playlist;
		$response['posts'] = $songs;
	
		//echo json_encode($response);
		drawItem($response);
		mysql_close($con);
		
	}
	
	
	
	getPlaylist();
	
	require_once 'fb.php';
	
?> 