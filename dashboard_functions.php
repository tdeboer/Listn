<?php

	function updateStream() {
		$sql1 = mysql_query("SELECT * FROM files ORDER BY date DESC LIMIT 3");
		if (!$sql1) die('Error: ' . mysql_error());
		
		while($file = mysql_fetch_array($sql1))
		{
			$players .= '<iframe id="ytplayer" type="text/html" width="100%" height="200" src="http://www.youtube.com/embed/' . $file['file_id'] . '?origin=http://listn.nl" frameborder="0"></iframe>';
		}
		
		print_r($players);
	}

?>