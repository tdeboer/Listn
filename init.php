<?php
	
	require_once 'config.php';
	
	
	$playlist = $_GET['id'];
	$sql1 = mysql_query("SELECT * FROM playlists WHERE uid='$playlist'");
		
	if (!$sql1)	
	{
		die('Error: ' . mysql_error());
	}
	
	while($pl = mysql_fetch_array($sql1))
	{
		$settings['public'] = $pl['public'];
		$settings['admin'] = $pl['admin_id'];
		$settings['time'] = $pl['date'];
		$settings['title'] = $pl['title'];
	}
	
	
	require_once 'fb.php';
?> 