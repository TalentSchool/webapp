<?php
	$out = shell_exec("/var/www/html/playsound.sh");

	echo "SUCCESS\n";
	echo $out;
?>
